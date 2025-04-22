// components/PokemonListScreen.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, Text, ActivityIndicator } from 'react-native';
import { fetchPokemonList, PokemonListItem } from '../services/api';
import PokemonCard from './PokemonCard';

const PokemonListScreen: React.FC = () => {
 const [pokemonList, setPokemonList] = useState<PokemonListItem[]>([]);
 const [loading, setLoading] = useState<boolean>(true);
 const [error, setError] = useState<string | null>(null);
 const [nextUrl, setNextUrl] = useState<string | null>(null);

useEffect(() => {
 loadPokemon();
 }, []);

 const loadPokemon = async (url?: string) => {
 setLoading(true);
 setError(null);
 try {
const offset = url ? getOffsetFromUrl(url) : 0;
 const data = await fetchPokemonList(20, offset);
console.log('Dados da API:', data); // Adicione este log
 setPokemonList(prevList => (url ? [...prevList, ...data.results] : data.results));
 setNextUrl(data.next);
 } catch (err: any) {
 setError(err.message);
 } finally {
 setLoading(false);
 }
 };

 const getOffsetFromUrl = (url: string | undefined): number => {
    if (!url) {
      return 0;
    }
    const urlParams = new URLSearchParams(url.split('?')[1]);
    const offset = urlParams.get('offset');
    return parseInt(offset || '0', 10);
  };

 const handleLoadMore = () => {
 if (nextUrl) {
 loadPokemon(nextUrl as string);
 }
 };

 if (loading) {
 return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="blue" /></View>;
 }

 if (error) {
 return <View style={styles.errorContainer}><Text>Erro ao carregar os Pokémon: {error}</Text></View>;
 }

 return (
 <View style={styles.container}>
<FlatList
data={pokemonList}
 keyExtractor={(item) => item.name}
 renderItem={({ item }) => <PokemonCard pokemon={item} />}
 onEndReached={handleLoadMore}
 onEndReachedThreshold={0.1}
 ListFooterComponent={nextUrl ? <ActivityIndicator style={styles.loadingMore} /> : null}
 />
 </View>
 );
};

const styles = StyleSheet.create({
 container: {
flex: 1,
 padding: 16,
 },
 loadingContainer: {
flex: 1,
 justifyContent: 'center',
 alignItems: 'center',
 },
 errorContainer: {
 flex: 1,
 justifyContent: 'center',
alignItems: 'center',
 },
 loadingMore: {
 paddingVertical: 20,
 },
});

export default PokemonListScreen;