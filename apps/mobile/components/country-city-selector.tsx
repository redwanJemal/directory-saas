import { View, Text, Pressable, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useCountries, useCities, type Country, type City } from '@/hooks/api/use-locations';
import { useLocationStore } from '@/store/location-store';
import { haptics } from '@/lib/haptics';

interface CountryCitySelectorProps {
  visible: boolean;
  onClose: () => void;
}

const COUNTRY_FLAGS: Record<string, string> = {
  AE: '🇦🇪',
  SA: '🇸🇦',
  KW: '🇰🇼',
  QA: '🇶🇦',
  BH: '🇧🇭',
  OM: '🇴🇲',
};

export function CountryCitySelector({ visible, onClose }: CountryCitySelectorProps) {
  const { t } = useTranslation();
  const { setLocation, clearLocation } = useLocationStore();
  const { data: countries, isLoading: countriesLoading } = useCountries();
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const { data: cities, isLoading: citiesLoading } = useCities(selectedCountry?.code ?? null);

  const handleSelectCountry = (country: Country) => {
    haptics.light();
    setSelectedCountry(country);
  };

  const handleSelectCity = (city: City) => {
    if (!selectedCountry) return;
    haptics.medium();
    setLocation(selectedCountry.code, selectedCountry.name, city.slug, city.name);
    setSelectedCountry(null);
    onClose();
  };

  const handleSelectCountryOnly = () => {
    if (!selectedCountry) return;
    haptics.medium();
    setLocation(selectedCountry.code, selectedCountry.name);
    setSelectedCountry(null);
    onClose();
  };

  const handleClear = () => {
    haptics.light();
    clearLocation();
    setSelectedCountry(null);
    onClose();
  };

  const handleBack = () => {
    setSelectedCountry(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[80%] rounded-t-3xl bg-surface pb-8">
          {/* Handle bar */}
          <View className="items-center py-3">
            <View className="h-1 w-10 rounded-full bg-border" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-4 pb-3">
            <View className="flex-row items-center">
              {selectedCountry && (
                <Pressable onPress={handleBack} className="mr-2">
                  <Ionicons name="arrow-back" size={22} color="#495057" />
                </Pressable>
              )}
              <Text className="text-lg font-bold text-content">
                {selectedCountry
                  ? t('location.selectCity')
                  : t('location.selectCountry')}
              </Text>
            </View>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#495057" />
            </Pressable>
          </View>

          <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
            {!selectedCountry ? (
              <>
                {/* All locations option */}
                <Pressable
                  className="mb-2 flex-row items-center rounded-card bg-surface-secondary px-4 py-3.5"
                  onPress={handleClear}
                >
                  <Ionicons name="globe-outline" size={24} color="#4c6ef5" />
                  <Text className="ml-3 flex-1 text-base font-medium text-content">
                    {t('location.allCountries')}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#adb5bd" />
                </Pressable>

                {countriesLoading ? (
                  <ActivityIndicator className="py-8" color="#4c6ef5" />
                ) : (
                  (countries as Country[] | undefined)?.map((country) => (
                    <Pressable
                      key={country.code}
                      className="mb-2 flex-row items-center rounded-card bg-surface-secondary px-4 py-3.5"
                      onPress={() => handleSelectCountry(country)}
                    >
                      <Text className="text-2xl">{COUNTRY_FLAGS[country.code] || '🌍'}</Text>
                      <Text className="ml-3 flex-1 text-base font-medium text-content">
                        {country.name}
                      </Text>
                      <Ionicons name="chevron-forward" size={18} color="#adb5bd" />
                    </Pressable>
                  ))
                )}
              </>
            ) : (
              <>
                {/* All cities in country */}
                <Pressable
                  className="mb-2 flex-row items-center rounded-card bg-surface-secondary px-4 py-3.5"
                  onPress={handleSelectCountryOnly}
                >
                  <Text className="text-2xl">{COUNTRY_FLAGS[selectedCountry.code] || '🌍'}</Text>
                  <Text className="ml-3 flex-1 text-base font-medium text-content">
                    {t('location.allCitiesIn', { country: selectedCountry.name })}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#adb5bd" />
                </Pressable>

                {citiesLoading ? (
                  <ActivityIndicator className="py-8" color="#4c6ef5" />
                ) : (
                  (cities as City[] | undefined)?.map((city) => (
                    <Pressable
                      key={city.slug}
                      className="mb-2 flex-row items-center rounded-card bg-surface-secondary px-4 py-3.5"
                      onPress={() => handleSelectCity(city)}
                    >
                      <Ionicons name="location-outline" size={22} color="#868e96" />
                      <Text className="ml-3 flex-1 text-base font-medium text-content">
                        {city.name}
                      </Text>
                      <Ionicons name="chevron-forward" size={18} color="#adb5bd" />
                    </Pressable>
                  ))
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
