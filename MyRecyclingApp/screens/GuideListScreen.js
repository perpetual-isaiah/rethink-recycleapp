import { useNavigation } from '@react-navigation/native';

export default function GuideListScreen() {
  const navigation = useNavigation();

  const onGuidePress = (guide) => {
    navigation.navigate('GuideScreen', { selectedGuide: guide });
  };

  return (
    <FlatList
      data={guideMaterials}
      keyExtractor={(item) => item.key}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => onGuidePress(item)}>
          {/* Render icon + label */}
        </TouchableOpacity>
      )}
    />
  );
}
