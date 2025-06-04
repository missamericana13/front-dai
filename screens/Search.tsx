// screens/Search.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Search() {
  const [searchText, setSearchText] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(['Empanadas', 'Tarta de acelga', 'Sopa paraguaya']);
  const [recommended, setRecommended] = useState<string[]>(['Guiso de lentejas', 'Pizza casera', 'Budín de pan']);
  const [filterVisible, setFilterVisible] = useState(false);

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text && !recentSearches.includes(text)) {
      const updatedSearches = [text, ...recentSearches].slice(0, 3);
      setRecentSearches(updatedSearches);
    }
  };

  return (
    <View style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Buscar recetas..."
          value={searchText}
          onChangeText={handleSearch}
        />
        <TouchableOpacity onPress={() => setFilterVisible(true)}>
          <Ionicons name="filter" size={28} color="#2B5399" />
        </TouchableOpacity>
      </View>

      {/* Búsquedas recientes */}
      <Text style={styles.sectionTitle}>Búsquedas recientes</Text>
      <FlatList
        data={recentSearches}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => <Text style={styles.item}>{item}</Text>}
      />

      {/* Recomendadas */}
      <Text style={styles.sectionTitle}>Recomendadas</Text>
      <FlatList
        data={recommended}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => <Text style={styles.item}>{item}</Text>}
      />

      {/* Modal de filtros */}
      <Modal visible={filterVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filtros</Text>
            {/* Aquí irían los filtros */}
            <TouchableOpacity style={styles.closeButton} onPress={() => setFilterVisible(false)}>
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDE5D8',
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    color: '#2B5399',
  },
  sectionTitle: {
    marginTop: 24,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2B5399',
  },
  item: {
    fontSize: 16,
    paddingVertical: 4,
    color: '#2B5399',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2B5399',
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: '#2B5399',
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
});
