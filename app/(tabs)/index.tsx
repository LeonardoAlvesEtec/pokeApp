import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, FlatList, Text, ActivityIndicator, TextInput, TouchableOpacity, Image } from 'react-native';
import { fetchPokemonList, PokemonListItem } from '../../services/api';
import PokemonCard from '../../components/PokemonCard';

interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokemonListItem[];
}

interface PokemonDetails {
  id: number;
  name: string;
  sprites: {
    front_default: string | null;
  };
  types: {
    type: {
      name: string;
      url: string;
    };
  }[];
  height: number;
  weight: number;
  url: string;
}

const TabOneScreen: React.FC = () => {
  const [pokemonList, setPokemonList] = useState<PokemonListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const loadingMoreRef = useRef<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const [filteredPokemonList, setFilteredPokemonList] = useState<PokemonListItem[]>([]);
  const [allPokemonNames, setAllPokemonNames] = useState<string[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonListItem | null>(null);
  const [pokemonDetails, setPokemonDetails] = useState<PokemonDetails | null>(null);

  const fetchAllPokemonNames = async (): Promise<string[]> => {
    const allNames: string[] = [];
    let url: string | null = 'https://pokeapi.co/api/v2/pokemon?limit=10000';

    while (url) {
      try {
        const response = await fetch(url);
        const data: PokemonListResponse = await response.json();
        if (data.results) {
          allNames.push(...data.results.map((pokemon) => pokemon.name));
        }
        url = data.next;
      } catch (error) {
        console.error('Erro ao buscar todos os nomes:', error);
        break;
      }
    }
    return allNames;
  };

  useEffect(() => {
    const loadAllNames = async () => {
      const names = await fetchAllPokemonNames();
      setAllPokemonNames(names);
    };
    loadAllNames();
  }, []);

  useEffect(() => {
    const uniqueUrls = new Set(pokemonList.map(p => p.url));
    if (uniqueUrls.size < pokemonList.length) {
      console.log('Aviso: URLs duplicadas encontradas:', pokemonList.map(p => p.url));
    }
  }, [pokemonList]);

  useEffect(() => {
    loadPokemon();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    if (debouncedSearchTerm) {
      setLoading(true);
      setError(null);
      setFilteredPokemonList([]);
      console.log('Pesquisando por:', debouncedSearchTerm);
      fetchSearchResults(debouncedSearchTerm);
    } else {
      console.log('Termo de pesquisa vazio, mostrando lista completa.');
      setFilteredPokemonList([...pokemonList]); 
    }
  }, [debouncedSearchTerm, allPokemonNames, pokemonList]);

  useEffect(() => {
    console.log('filteredPokemonList atualizado:', filteredPokemonList);
  }, [filteredPokemonList]);

  const fetchSearchResults = async (searchText: string) => {
    const results: PokemonListItem[] = [];
    const filteredNames = allPokemonNames.filter(name =>
      name.toLowerCase().includes(searchText.toLowerCase())
    );
    console.log('Nomes filtrados:', filteredNames);

    for (const name of filteredNames) {
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
        if (response.ok) {
          const contentType = response.headers.get('Content-Type');
          if (contentType && contentType.includes('application/json')) {
            const data: PokemonDetails = await response.json();
            console.log('Dados da pesquisa para', name, ':', data);
            const specificPokemonData: PokemonListItem = {
              name: data.name,
              url: data.url || '',
            };
            results.push(specificPokemonData);
          } else {
            console.error('Resposta da API não é JSON:', await response.text());
            setError('Erro: Resposta da API em formato inesperado.');
            setLoading(false);
            return;
          }
        } else if (response.status === 404) {
          console.log(`Pokémon não encontrado: ${name}`);
        } else {
          console.error(`Erro ao buscar detalhes de ${name}: Status ${response.status}`);
          setError('Erro ao buscar Pokémon');
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Erro na requisição:', error);
        setError('Erro ao buscar Pokémon');
        setLoading(false);
        return;
      }
      if (results.length > 20) {
        break;
      }
    }
    setFilteredPokemonList([...results]); 
    setLoading(false);
    console.log('Resultados da pesquisa:', results);
  };

  const loadPokemon = async (url?: string) => {
    if (loadingMoreRef.current || selectedPokemon) {
      return;
    }
    loadingMoreRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const offset = url ? getOffsetFromUrl(url) : 0;
      const data = await fetchPokemonList(1000, offset); 
      setPokemonList(prevList => (url ? [...prevList, ...data.results] : data.results));
      setNextUrl(data.next);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      loadingMoreRef.current = false;
    }
  };

  const getOffsetFromUrl = (url: string | undefined): number => {
    if (!url) return 0;
    const urlParams = new URLSearchParams(url.split('?')[1]);
    const offset = urlParams.get('offset');
    return parseInt(offset || '0', 10);
  };

  const handleLoadMore = () => {
    if (nextUrl && !loadingMoreRef.current && searchTerm === '') {
      loadPokemon(nextUrl as string);
    }
  };

  const handlePokemonPress = async (pokemon: PokemonListItem) => {
    setSelectedPokemon(pokemon);
    setPokemonDetails(null);
    setLoading(true);
    setError(null);
    console.log('handlePokemonPress chamado para:', pokemon.name, 'URL:', pokemon.url); 
    try {
      const response = await fetch(pokemon.url);
      if (response.ok) {
        const contentType = response.headers.get('Content-Type');
        if (contentType && contentType.includes('application/json')) {
          const data: PokemonDetails = await response.json();
          setPokemonDetails(data);
        } else {
          console.error('Resposta da API para detalhes não é JSON:', await response.text());
          setError('Erro: Resposta da API em formato inesperado.');
        }
      } else {
        console.error('Erro ao buscar detalhes do Pokémon:', response.status);
        setError('Erro ao carregar detalhes');
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do Pokémon:', error);
      setError('Erro ao carregar detalhes');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedPokemon(null);
    setPokemonDetails(null);
  };

  if (loading && pokemonList.length === 0 && !searchTerm && !selectedPokemon) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="blue" /></View>;
  }

  if (error) {
    return <View style={styles.errorContainer}><Text>Erro ao carregar os Pokémon: {error}</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar Pokémon"
          value={searchTerm}
          onChangeText={(text) => setSearchTerm(text)}
          placeholderTextColor="white"
        />
      </View>
      <FlatList
  data={filteredPokemonList}
  keyExtractor={(item) => item.url}
  renderItem={({ item }) => (
    <PokemonCard
      pokemon={item}
      onPress={handlePokemonPress} 
      key={item.url}
    />
        )}
        key={`flatlist-${JSON.stringify(filteredPokemonList.map(p => p.url))}`}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={() => debouncedSearchTerm && !loading && (
          <Text style={styles.emptyListText}>Nenhum Pokémon encontrado.</Text>
        )}
      />
      {!searchTerm && nextUrl && !selectedPokemon && <ActivityIndicator style={styles.loadingMore} />}

      {selectedPokemon && pokemonDetails && (
        <View style={styles.detailsContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={handleCloseDetails}>
            <Text>Fechar</Text>
          </TouchableOpacity>
          <Text style={styles.detailsTitle}>{pokemonDetails.name.toUpperCase()}</Text>
          {pokemonDetails.sprites?.front_default && (
            <Image
              source={{ uri: pokemonDetails.sprites.front_default }}
              style={styles.pokemonImage}
              resizeMode="contain"
            />
          )}
          <Text style={styles.detailsText}>Tipos: {pokemonDetails.types?.map(type => type.type.name).join(', ')}</Text>
          <Text style={styles.detailsText}>Altura: {pokemonDetails.height}</Text>
          <Text style={styles.detailsText}>Peso: {pokemonDetails.weight}</Text>
          {/* Adicione mais detalhes conforme necessário */}
        </View>
      )}

      {loading && selectedPokemon && (
        <View style={styles.loadingDetailsContainer}>
          <ActivityIndicator size="large" color="blue" />
        </View>
      )}

      {error && selectedPokemon && (
        <View style={styles.errorDetailsContainer}>
          <Text style={styles.errorDetailsText}>Erro ao carregar detalhes: {error}</Text>
          <TouchableOpacity onPress={handleCloseDetails}>
            <Text style={styles.errorDetailsButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#333' },
  searchContainer: { paddingBottom: 16 },
  searchInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    fontSize: 16,
    color: 'white',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingMore: { paddingVertical: 20 },
  detailsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'white',
  },
  detailsText: {
    color: 'white',
    marginBottom: 5,
  },
  pokemonImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 10,
    backgroundColor: 'lightgray',
    borderRadius: 5,
  },
  loadingDetailsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorDetailsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorDetailsText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorDetailsButtonText: {
    color: 'black',
  },
  emptyListText: {
    color: 'white',
    fontSize: 16,
    marginTop: 20,
    alignSelf: 'center',
  },
});

export default TabOneScreen;
