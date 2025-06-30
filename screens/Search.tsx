import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

const API_BASE_URL = 'http://192.168.1.31:8080/api/recetas';

interface Usuario {
  nombre: string;
  avatar?: string;
}

interface Receta {
  idReceta: number;
  nombreReceta: string;
  descripcionReceta?: string;
  fotoPrincipal?: string;
  usuario: Usuario;
  porciones?: number;
  cantidadPersonas?: number;
  fechaCreacion?: string;
  ingredientes?: any[];
}

export default function SearchScreen() {
  const [searchText, setSearchText] = useState('');
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);

  // Filtros
  const [ingrediente, setIngrediente] = useState('');
  const [sinIngrediente, setSinIngrediente] = useState('');
  const [sortBy, setSortBy] = useState('nombreReceta');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  // Sugerencias y recomendaciones
  const [sugerencias, setSugerencias] = useState<Receta[]>([]);
  const [recomendadas, setRecomendadas] = useState<Receta[]>([]);

  // Cargar sugerencias (últimas 3 recetas creadas)
  useEffect(() => {
    const fetchSugerencias = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/ultimas`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          let data: Receta[] = await res.json();
          data = data.map((receta) => ({
            ...receta,
            fotoPrincipal: receta.fotoPrincipal
              ? `data:image/jpeg;base64,${receta.fotoPrincipal}`
              : 'https://via.placeholder.com/400x160?text=Sin+Imagen',
            usuario: {
              ...receta.usuario,
              avatar: receta.usuario?.avatar
                ? `data:image/jpeg;base64,${receta.usuario.avatar}`
                : 'https://ui-avatars.com/api/?name=User',
            },
          }));
          setSugerencias(data);
        }
      } catch {
        setSugerencias([]);
      }
    };
    fetchSugerencias();
  }, []);

  // Construir la URL según los filtros
  const buildUrl = () => {
    if (ingrediente) {
      return `${API_BASE_URL}/ingrediente?nombreIngrediente=${encodeURIComponent(ingrediente)}&sortBy=${sortBy}&order=${order}`;
    }
    if (sinIngrediente) {
      return `${API_BASE_URL}/sin-ingrediente?nombreIngrediente=${encodeURIComponent(sinIngrediente)}&sortBy=${sortBy}&order=${order}`;
    }
    // Por nombre (búsqueda principal)
    return `${API_BASE_URL}/buscar?nombre=${encodeURIComponent(searchText)}&sortBy=${sortBy}&order=${order}`;
  };

  const handleSearch = async () => {
    setLoading(true);
    setRecetas([]);
    setRecomendadas([]);
    try {
      const token = await AsyncStorage.getItem('token');
      const url = buildUrl();
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error('Error al buscar recetas');
      let data: Receta[] = await response.json();

      data = data.map((receta) => ({
        ...receta,
        fotoPrincipal: receta.fotoPrincipal
          ? `data:image/jpeg;base64,${receta.fotoPrincipal}`
          : 'https://via.placeholder.com/400x160?text=Sin+Imagen',
        usuario: {
          ...receta.usuario,
          avatar: receta.usuario?.avatar
            ? `data:image/jpeg;base64,${receta.usuario.avatar}`
            : 'https://ui-avatars.com/api/?name=User',
        },
      }));

      setRecetas(data);

      // Si no hay resultados, mostrar recomendaciones (últimas 3 creadas)
      if (data.length === 0) {
        setRecomendadas(sugerencias);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron buscar recetas.');
      setRecetas([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtros
  const applyFilters = () => {
    setFilterVisible(false);
    handleSearch();
  };

  const clearFilters = () => {
    setIngrediente('');
    setSinIngrediente('');
    setSortBy('nombreReceta');
    setOrder('asc');
    setFilterVisible(false);
    handleSearch();
  };

  const renderItem = ({ item }: { item: Receta }) => (
    <TouchableOpacity
      onPress={() =>
        router.push(`/drawer/recipedetail?id=${encodeURIComponent(item.idReceta.toString())}`)
      }
    >
      <View style={styles.card}>
        <Image
          source={{ uri: item.fotoPrincipal }}
          style={styles.image}
        />
        <View style={styles.cardContent}>
          <Text style={styles.title}>{item.nombreReceta}</Text>
          <Text style={styles.description}>
            {item.descripcionReceta || 'Sin descripción'}
          </Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>
              {item.porciones ? `Porciones: ${item.porciones}` : ''}
            </Text>
          </View>
          <View style={styles.userRow}>
            <Image
              source={{ uri: item.usuario.avatar }}
              style={styles.avatar}
            />
            <Text>{item.usuario.nombre}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Buscar recetas..."
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity onPress={handleSearch}>
          <Ionicons name="search" size={28} color="#2B5399" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilterVisible(true)} style={{ marginLeft: 8 }}>
          <Ionicons name="filter" size={28} color="#2B5399" />
        </TouchableOpacity>
      </View>
      {/* Sugerencias antes de buscar */}
      {searchText.trim().length === 0 && recetas.length === 0 && (
        <View style={styles.sugerenciasContainer}>
          <Text style={styles.sectionTitle}>Sugerencias</Text>
          <FlatList
            data={sugerencias}
            keyExtractor={(item) => item.idReceta.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() =>
                router.push(`/drawer/recipedetail?id=${encodeURIComponent(item.idReceta.toString())}`)
              }>
                <View style={styles.card}>
                  <Image source={{ uri: item.fotoPrincipal }} style={styles.image} />
                  <View style={styles.cardContent}>
                    <Text style={styles.title}>{item.nombreReceta}</Text>
                    <Text style={styles.description}>{item.descripcionReceta || 'Sin descripción'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.list}
          />
        </View>
      )}
      {/* Filtros Modal */}
      <Modal visible={filterVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filtros</Text>
            {/* Contiene ingrediente */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Contiene ingrediente</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Ej: pollo"
                value={ingrediente}
                onChangeText={setIngrediente}
              />
            </View>
            {/* Sin ingrediente */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Sin ingrediente</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Ej: harina"
                value={sinIngrediente}
                onChangeText={setSinIngrediente}
              />
            </View>
            {/* Ordenar por */}
            <Text style={styles.filterLabel}>Ordenar por</Text>
            <Picker
              selectedValue={sortBy}
              onValueChange={value => setSortBy(value)}
              style={styles.picker}
            >
              <Picker.Item label="Nombre" value="nombreReceta" />
              <Picker.Item label="Fecha" value="fechaCreacion" />
              <Picker.Item label="Usuario" value="usuario.nombre" />
            </Picker>
            {/* Orden */}
            <Text style={styles.filterLabel}>Orden</Text>
            <Picker
              selectedValue={order}
              onValueChange={value => setOrder(value)}
              style={styles.picker}
            >
              <Picker.Item label="Ascendente" value="asc" />
              <Picker.Item label="Descendente" value="desc" />
            </Picker>
            <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
              <Text style={styles.applyButtonText}>Aplicar filtros</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>Limpiar filtros</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => setFilterVisible(false)}>
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Resultados */}
      {loading ? (
        <ActivityIndicator size="large" color="#2B5399" style={{ flex: 1 }} />
      ) : recetas.length > 0 ? (
        <FlatList
          data={recetas}
          keyExtractor={(item) => item.idReceta.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      ) : (
        searchText.trim().length > 0 && (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No hay recetas con ese nombre.</Text>
            {recomendadas.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Te recomendamos:</Text>
                <FlatList
                  data={recomendadas}
                  keyExtractor={(item) => item.idReceta.toString()}
                  renderItem={renderItem}
                  contentContainerStyle={styles.list}
                />
              </>
            )}
          </View>
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDE5D8',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    margin: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    color: '#2B5399',
    fontSize: 16,
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 10,
  },
  filterLabel: {
    fontSize: 14,
    color: '#2B5399',
    minWidth: 120,
    marginRight: 8,
    marginTop: 0,
    marginBottom: 0,
  },
  filterInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    color: '#2B5399',
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 160,
  },
  cardContent: {
    padding: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2B5399',
  },
  description: {
    fontSize: 14,
    marginVertical: 6,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#555',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
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
  picker: {
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  applyButton: {
    marginTop: 16,
    backgroundColor: '#2B5399',
    paddingVertical: 10,
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  clearButton: {
    marginTop: 8,
    backgroundColor: '#EDE5D8',
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#2B5399',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 8,
    backgroundColor: '#ccc',
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#413E3E',
    textAlign: 'center',
  },
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: '#2B5399',
    marginBottom: 16,
  },
  sectionTitle: {
    marginTop: 24,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2B5399',
    alignSelf: 'flex-start',
  },
  sugerenciasContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
});