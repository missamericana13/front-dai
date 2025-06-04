import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Button,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/authContext';
import { useRouter } from 'expo-router';

export default function CoursesScreen() {
  const { isAuthenticated, userRole } = useAuth();
  const router = useRouter();

  const courses = [
    {
      id: '1',
      title: 'Milanesas 101',
      description: 'Aprendé a hacer la milanesa perfecta, desde la carne hasta el empanizado.',
      schedule: 'Lunes y miércoles - 18:00 a 20:00',
      classes: 10,
      price: '$12.000',
      image: 'https://negociosdeargentina.com.ar/wp-content/uploads/2024/04/Milanesa.webp',
    },
    {
      id: '2',
      title: 'Pastas Frescas',
      description: 'Descubrí el arte de hacer pastas caseras',
      schedule: 'Martes y jueves - 17:00 a 19:00',
      classes: 15,
      price: '$10.000',
      image: 'https://osojimix.com/wp-content/uploads/2021/04/PASTAS-FRESCAS-MASA-500x375.jpg',
    },
  ];

  const handleViewDetails = (courseId: string) => {
    router.push(`./coursesdetail`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {courses.map((course) => {
        const cardContent = (
          <View style={styles.card}>
            <Image source={{ uri: course.image }} style={styles.image} />
            <View style={styles.content}>
              <Text style={styles.title}>{course.title}</Text>
              <Text style={styles.description}>{course.description}</Text>

              {isAuthenticated && (
                <>
                  <Text style={styles.detail}>🕒 {course.schedule}</Text>
                  <Text style={styles.detail}>📚 {course.classes} clases</Text>
                  <Text style={styles.price}>{course.price}</Text>
                </>
              )}

              {userRole === 'alumno' && (
                <View style={{ marginTop: 10 }}>
                  <Button
                    title="Ver más"
                    color="#2B5399"
                    onPress={() => handleViewDetails(course.id)}
                  />
                </View>
              )}
            </View>
          </View>
        );

        return userRole === 'alumno' ? (
          <TouchableOpacity key={course.id} onPress={() => handleViewDetails(course.id)}>
            {cardContent}
          </TouchableOpacity>
        ) : (
          <View key={course.id}>{cardContent}</View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#EDE5D8',
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: 160,
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2B5399',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
  },
  detail: {
    fontSize: 13,
    color: '#555',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2B5399',
    marginTop: 8,
  },
});
