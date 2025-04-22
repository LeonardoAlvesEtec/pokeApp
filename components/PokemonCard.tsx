// components/PokemonCard.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { PokemonListItem } from '../services/api'; 

interface Props {
  pokemon: PokemonListItem;
  onPress: (pokemon: PokemonListItem) => void;
}

const PokemonCard: React.FC<Props> = ({ pokemon, onPress }) => {
  const getPokemonIdFromUrl = (url: string): string | null => {
    const parts = url.split('/');
    return parts[parts.length - 2] || null;
  };

  const pokemonId = getPokemonIdFromUrl(pokemon.url);
  const imageUrl = pokemonId ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png` : null;

  console.log('PokemonCard renderizado para:', pokemon.name, 'URL da imagem:', imageUrl, 'Pokemon object:', pokemon); 
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(pokemon)} key={pokemon.url}>
      <View style={styles.imageContainer}>
        {imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="contain"
            onError={(error) => console.error('Erro ao carregar imagem:', error)}
          />
        )}
      </View>
      <Text style={styles.name}>{pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    width: 50,
    height: 50,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PokemonCard;
