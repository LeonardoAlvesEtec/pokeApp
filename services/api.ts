// services/api.ts
const API_BASE_URL = 'https://pokeapi.co/api/v2';

export interface PokemonListItem {
  name: string;
  url: string;
}

interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokemonListItem[];
}

export const fetchPokemonList = async (limit: number = 100, offset: number = 0): Promise<PokemonListResponse> => {
    const url = `${API_BASE_URL}/pokemon?limit=${limit}&offset=${offset}`;
    console.log('URL da requisição:', url); // Adicione este log
    try {
      const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: PokemonListResponse = await response.json();
    return data;
  } catch (error: any) {
    console.error("Erro ao buscar lista de Pokémon:", error);
    throw error;
  }
};

export const fetchPokemonDetails = async (url: string): Promise<any> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Erro ao buscar detalhes do Pokémon:", error);
    throw error;
  }
};