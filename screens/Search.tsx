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
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

const API_BASE_URL = 'http://192.168.1.31:8080/api/recetas';

interface Usuario {
  nombre: string;
  alias?: string;
  avatar?: string;
}

interface TipoReceta {
  nombre?: string;
}

interface Receta {
  idReceta: number;
  nombreReceta: string;
  descripcionReceta?: string;
  fotoPrincipal?: string;
  usuario: Usuario;
  porciones?: number;
  cantidadPersonas?: number;
  tipoReceta?: TipoReceta;
  fechaCreacion?: string;
  ingredientes?: any[];
  tiempoPreparacion?: number;
  dificultad?: string;
}

export default function SearchScreen() {
  const [searchText, setSearchText] = useState('');
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Filtros
  const [ingrediente, setIngrediente] = useState('');
  const [sinIngrediente, setSinIngrediente] = useState('');
  const [sortBy, setSortBy] = useState('nombreReceta');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  // Sugerencias y recomendaciones
  const [sugerencias, setSugerencias] = useState<Receta[]>([]);
  const [recomendadas, setRecomendadas] = useState<Receta[]>([]);

  // ✅ Formatear tiempo de preparación
  const formatearTiempo = (minutos?: number) => {
    if (!minutos) return null;
    
    if (minutos < 60) {
      return `${minutos} min`;
    } else {
      const horas = Math.floor(minutos / 60);
      const mins = minutos % 60;
      return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
    }
  };

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
              : `https://picsum.photos/400/300?random=${receta.idReceta}`,
            usuario: {
              ...receta.usuario,
              avatar: receta.usuario?.avatar
                ? `data:image/jpeg;base64,${receta.usuario.avatar}`
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(receta.usuario?.nombre || 'User')}`,
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
    return `${API_BASE_URL}/buscar?nombre=${encodeURIComponent(searchText)}&sortBy=${sortBy}&order=${order}`;
  };

  const handleSearch = async () => {
    if (!searchText.trim() && !ingrediente && !sinIngrediente) {
      Alert.alert('Búsqueda vacía', 'Escribe algo para buscar o usa los filtros');
      return;
    }

    setLoading(true);
    setRecetas([]);
    setRecomendadas([]);
    setHasSearched(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const url = buildUrl();
      console.log('🔍 Buscando:', url);
      
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (!response.ok) throw new Error('Error al buscar recetas');
      let data: Receta[] = await response.json();

      data = data.map((receta) => ({
        ...receta,
        fotoPrincipal: receta.fotoPrincipal
          ? `data:image/jpeg;base64,${receta.fotoPrincipal}`
          : `https://picsum.photos/400/300?random=${receta.idReceta}`,
        usuario: {
          ...receta.usuario,
          avatar: receta.usuario?.avatar
            ? `data:image/jpeg;base64,${receta.usuario.avatar}`
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(receta.usuario?.nombre || 'User')}`,
        },
      }));

      setRecetas(data);

      // Si no hay resultados, mostrar recomendaciones
      if (data.length === 0) {
        setRecomendadas(sugerencias);
      }
      
      console.log('✅ Resultados encontrados:', data.length);
    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      Alert.alert('Error', 'No se pudieron buscar recetas.');
      setRecetas([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ✅ Refresh
  const onRefresh = () => {
    setRefreshing(true);
    if (hasSearched) {
      handleSearch();
    } else {
      setRefreshing(false);
    }
  };

  // ✅ Verificar si hay filtros activos
  const hasActiveFilters = ingrediente || sinIngrediente || sortBy !== 'nombreReceta' || order !== 'asc';

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
  };

  // ✅ Cards mejoradas
  const renderItem = ({ item }: { item: Receta }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push(`/drawer/recipedetail?id=${item.idReceta}`)
      }
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.fotoPrincipal }}
          style={styles.image}
          onError={() => console.log('Error cargando imagen')}
        />
        {item.tipoReceta?.nombre && (
          <View style={styles.tipoBadge}>
            <Text style={styles.tipoText}>{item.tipoReceta.nombre}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={2}>{item.nombreReceta}</Text>
        
        {item.descripcionReceta && (
          <Text style={styles.description} numberOfLines={2}>
            {item.descripcionReceta}
          </Text>
        )}

        <View style={styles.metaInfo}>
          {item.cantidadPersonas && (
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={14} color="#666" />
              <Text style={styles.metaText}>{item.cantidadPersonas} personas</Text>
            </View>
          )}
          
          {formatearTiempo(item.tiempoPreparacion) && (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.metaText}>{formatearTiempo(item.tiempoPreparacion)}</Text>
            </View>
          )}
          
          {item.dificultad && (
            <View style={styles.metaItem}>
              <Ionicons name="bar-chart-outline" size={14} color="#666" />
              <Text style={styles.metaText}>{item.dificultad}</Text>
            </View>
          )}
        </View>

        <View style={styles.autorContainer}>
          <Image
            source={{ uri: item.usuario.avatar }}
            style={styles.avatar}
          />
          <View style={styles.autorInfo}>
            <Text style={styles.autorNombre} numberOfLines={1}>
              {item.usuario.alias || item.usuario.nombre}
            </Text>
            <Text style={styles.autorLabel}>Chef</Text>
          </View>
          <View style={styles.verMasContainer}>
            <Ionicons name="chevron-forward" size={16} color="#2B5399" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // ✅ Sugerencias compactas
  const renderSugerenciaItem = ({ item }: { item: Receta }) => (
    <TouchableOpacity
      style={styles.sugerenciaCard}
      onPress={() =>
        router.push(`/drawer/recipedetail?id=${item.idReceta}`)
      }
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.fotoPrincipal }}
        style={styles.sugerenciaImage}
      />
      <View style={styles.sugerenciaContent}>
        <Text style={styles.sugerenciaTitle} numberOfLines={2}>
          {item.nombreReceta}
        </Text>
        <Text style={styles.sugerenciaAutor} numberOfLines={1}>
          Por {item.usuario.alias || item.usuario.nombre}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ Barra de búsqueda mejorada */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.input}
              placeholder="Buscar recetas..."
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchText('');
                  setRecetas([]);
                  setHasSearched(false);
                }}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity
            style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
            onPress={() => setFilterVisible(true)}
          >
            <Ionicons 
              name="options-outline" 
              size={20} 
              color={hasActiveFilters ? '#2B5399' : '#666'} 
            />
            {hasActiveFilters && <View style={styles.filterDot} />}
          </TouchableOpacity>
        </View>

        {/* ✅ Chips de filtros activos */}
        {hasActiveFilters && (
          <ScrollView 
            horizontal 
            style={styles.filtersChipsContainer}
            showsHorizontalScrollIndicator={false}
          >
            {ingrediente && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>Con: {ingrediente}</Text>
                <TouchableOpacity onPress={() => setIngrediente('')}>
                  <Ionicons name="close" size={16} color="#2B5399" />
                </TouchableOpacity>
              </View>
            )}
            {sinIngrediente && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>Sin: {sinIngrediente}</Text>
                <TouchableOpacity onPress={() => setSinIngrediente('')}>
                  <Ionicons name="close" size={16} color="#2B5399" />
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              style={styles.clearAllFiltersChip}
              onPress={clearFilters}
            >
              <Text style={styles.clearAllFiltersText}>Limpiar todo</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* ✅ Contenido principal */}
      {!hasSearched && (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2B5399']} />
          }
        >
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>¿Qué quieres cocinar hoy?</Text>
            <Text style={styles.welcomeSubtitle}>
              Busca por nombre, ingredientes o explora nuestras sugerencias
            </Text>
          </View>

          {sugerencias.length > 0 && (
            <View style={styles.sugerenciasSection}>
              <Text style={styles.sectionTitle}>Recetas populares</Text>
              <FlatList
                data={sugerencias}
                keyExtractor={(item) => `sugerencia-${item.idReceta}`}
                renderItem={renderSugerenciaItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sugerenciasList}
                ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              />
            </View>
          )}

        </ScrollView>
      )}

      {/* ✅ Resultados de búsqueda */}
      {hasSearched && (
        <>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2B5399" />
              <Text style={styles.loadingText}>Buscando recetas...</Text>
            </View>
          ) : recetas.length > 0 ? (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>
                {recetas.length} resultado{recetas.length !== 1 ? 's' : ''} encontrado{recetas.length !== 1 ? 's' : ''}
              </Text>
              <FlatList
                data={recetas}
                keyExtractor={(item) => `resultado-${item.idReceta}`}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2B5399']} />
                }
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              />
            </View>
          ) : (
            <ScrollView 
              style={styles.content}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2B5399']} />
              }
            >
              <View style={styles.noResultsContainer}>
                <Ionicons name="search-outline" size={64} color="#ccc" />
                <Text style={styles.noResultsTitle}>No encontramos recetas</Text>
                <Text style={styles.noResultsSubtitle}>
                  Intenta con otros términos o usa filtros diferentes
                </Text>
                
                {recomendadas.length > 0 && (
                  <View style={styles.recomendadasSection}>
                    <Text style={styles.sectionTitle}>Te recomendamos</Text>
                    <FlatList
                      data={recomendadas}
                      keyExtractor={(item) => `recomendada-${item.idReceta}`}
                      renderItem={renderItem}
                      scrollEnabled={false}
                      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    />
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </>
      )}

      {/* ✅ Modal de filtros mejorado */}
      <Modal visible={filterVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros de búsqueda</Text>
              <TouchableOpacity onPress={() => setFilterVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Contiene ingrediente */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Debe contener ingrediente</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="Ej: pollo, arroz, tomate..."
                  placeholderTextColor="#999"
                  value={ingrediente}
                  onChangeText={setIngrediente}
                />
              </View>

              {/* Sin ingrediente */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>No debe contener</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="Ej: harina, lactosa, nueces..."
                  placeholderTextColor="#999"
                  value={sinIngrediente}
                  onChangeText={setSinIngrediente}
                />
              </View>

              {/* Ordenar por */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Ordenar por</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={sortBy}
                    onValueChange={value => setSortBy(value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Nombre de la receta" value="nombreReceta" />
                    <Picker.Item label="Fecha de creación" value="fechaCreacion" />
                    <Picker.Item label="Nombre del chef" value="usuario.nombre" />
                  </Picker>
                </View>
              </View>

              {/* Orden */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Dirección</Text>
                <View style={styles.orderButtons}>
                  <TouchableOpacity
                    style={[styles.orderButton, order === 'asc' && styles.orderButtonActive]}
                    onPress={() => setOrder('asc')}
                  >
                    <Ionicons name="arrow-up" size={16} color={order === 'asc' ? '#2B5399' : '#666'} />
                    <Text style={[styles.orderButtonText, order === 'asc' && styles.orderButtonTextActive]}>
                      Ascendente
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.orderButton, order === 'desc' && styles.orderButtonActive]}
                    onPress={() => setOrder('desc')}
                  >
                    <Ionicons name="arrow-down" size={16} color={order === 'desc' ? '#2B5399' : '#666'} />
                    <Text style={[styles.orderButtonText, order === 'desc' && styles.orderButtonTextActive]}>
                      Descendente
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                <Text style={styles.clearFiltersButtonText}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.applyButtonText}>Aplicar filtros</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2B5399',
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#e8f2ff',
    borderColor: '#2B5399',
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4757',
  },
  filtersChipsContainer: {
    marginTop: 12,
    marginBottom: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2B5399',
  },
  filterChipText: {
    color: '#2B5399',
    fontSize: 12,
    fontWeight: '500',
    marginRight: 4,
  },
  clearAllFiltersChip: {
    backgroundColor: '#ff475720',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ff4757',
  },
  clearAllFiltersText: {
    color: '#ff4757',
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  welcomeSection: {
    padding: 20,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2B5399',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  sugerenciasSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2B5399',
    marginLeft: 16,
    marginBottom: 12,
  },
  sugerenciasList: {
    paddingHorizontal: 16,
  },
  sugerenciaCard: {
    width: 160,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sugerenciaImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#f0f0f0',
    resizeMode: 'cover',
  },
  sugerenciaContent: {
    padding: 12,
  },
  sugerenciaTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2B5399',
    marginBottom: 4,
  },
  sugerenciaAutor: {
    fontSize: 12,
    color: '#666',
  },
  quickActionsSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#2B5399',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2B5399',
    margin: 16,
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  noResultsSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  recomendadasSection: {
    width: '100%',
    marginTop: 40,
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#f0f0f0',
    resizeMode: 'cover',
  },
  tipoBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(43, 83, 153, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tipoText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2B5399',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  autorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  autorInfo: {
    flex: 1,
  },
  autorNombre: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2B5399',
  },
  autorLabel: {
    fontSize: 12,
    color: '#666',
  },
  verMasContainer: {
    padding: 4,
  },
  // ✅ Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '85%', // ✅ CAMBIO: Altura fija más alta
    maxHeight: '85%', // ✅ CAMBIO: Altura máxima aumentada
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2B5399',
  },
  modalBody: {
    flex: 1, // ✅ CAMBIO: Flex para ocupar espacio disponible
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 0, // ✅ CAMBIO: Sin padding bottom
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2B5399',
    marginBottom: 8,
  },
  filterInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2B5399',
  },
  pickerContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
  },
  picker: {
    backgroundColor: 'transparent',
    height: 50,
  },
  orderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  orderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  orderButtonActive: {
    backgroundColor: '#e8f2ff',
    borderColor: '#2B5399',
  },
  orderButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  orderButtonTextActive: {
    color: '#2B5399',
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
    backgroundColor: "white",
  },
  clearFiltersButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  clearFiltersButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#2B5399',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});