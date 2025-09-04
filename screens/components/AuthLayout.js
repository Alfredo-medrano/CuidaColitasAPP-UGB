import React from 'react';
import { View, Text, ImageBackground, StyleSheet, Pressable, KeyboardAvoidingView, Platform, Image, ScrollView } from 'react-native';

export default function AuthLayout({ activeTab, onTabChange, title, children }) {
  return (
    <ImageBackground
      source={require('../../assets/welcome.jpg')}
      style={styles.bg}
      resizeMode="cover"
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <View style={styles.card}>
            <View style={styles.tabs}>
              <Pressable onPress={() => onTabChange('login')} style={[styles.tabBtn, activeTab === 'login' && styles.tabBtnActive]}>
                <Text style={[styles.tabTxt, activeTab === 'login' && styles.tabTxtActive]}>LOG IN</Text>
              </Pressable>
              <Pressable onPress={() => onTabChange('signup')} style={[styles.tabBtn, activeTab === 'signup' && styles.tabBtnActive]}>
                <Text style={[styles.tabTxt, activeTab === 'signup' && styles.tabTxtActive]}>SIGN UP</Text>
              </Pressable>
            </View>

            <Text style={styles.title}>{title}</Text>
            {children}
          </View>

          <View style={styles.logoWrap}>
            <Image source={require('../../assets/banner.jpg')} style={{ width: 140, height: 40, resizeMode: 'contain' }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const COLORS = { primary: '#43C0AF', dark: '#013847', paper: '#E2ECED' };

const styles = StyleSheet.create({
  bg: { flex: 1 },
  card: {
    alignSelf: 'center',
    width: '88%',
    backgroundColor: COLORS.paper,
    borderRadius: 18,
    padding: 18,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  tabs: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: 'rgba(1,56,71,0.15)',
    borderRadius: 24,
    padding: 4,
    marginBottom: 8,
    gap: 6,
  },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  tabBtnActive: { backgroundColor: COLORS.primary },
  tabTxt: { color: COLORS.dark, fontWeight: '700' },
  tabTxtActive: { color: 'white' },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.dark, marginVertical: 8, textAlign: 'center' },
  logoWrap: { alignItems: 'center', marginTop: 16 },
});
