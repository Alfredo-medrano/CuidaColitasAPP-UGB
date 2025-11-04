// src/components/admin/NewVetModal.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../../theme/theme';
import { supabase } from '../../api/Supabase';

const Dropdown = ({ label, data, selected, onSelect, placeholder }) => {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.dropdownBlock}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={[styles.selectBtn, open && styles.selectBtnOpen]}
        onPress={() => setOpen(!open)}
        activeOpacity={0.9}
      >
        <Text style={[styles.selectBtnText, !selected && { color: COLORS.gray }]}>
          {selected ? selected.name : placeholder}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={COLORS.text}
        />
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdownList}>
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  onSelect(item);
                  setOpen(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

export default function NewVetModal({ visible, onClose, onAdded }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    specialty: '',
    phone: '',
    password: '',
  });

  const [clinics, setClinics] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selClinic, setSelClinic] = useState(null);
  const [selRole, setSelRole] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');

  // Cargar clínicas y roles al abrir el modal
  useEffect(() => {
    if (!visible) return;
    (async () => {
      setErrorText('');
      const [{ data: cData, error: cErr }, { data: rData, error: rErr }] = await Promise.all([
        supabase.from('clinics').select('id,name').order('name', { ascending: true }),
        supabase.from('roles').select('id,name').order('name', { ascending: true }),
      ]);
      if (cErr) console.log('clinics err:', cErr.message);
      if (rErr) console.log('roles err:', rErr.message);
      setClinics(cData || []);
      setRoles(rData || []);
    })();
  }, [visible]);

  const canSubmit = useMemo(() => {
    return (
      form.name.trim() &&
      form.email.trim() &&
      form.password.trim() &&
      selClinic?.id &&
      selRole?.id
    );
  }, [form, selClinic, selRole]);

  const change = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setErrorText('');

      if (!canSubmit) {
        setErrorText('Completa todos los campos obligatorios.');
        setSubmitting(false);
        return;
      }

      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: { data: { name: form.name.trim() } },
      });
      if (authErr) throw new Error(`Auth: ${authErr.message}`);

      const userId = authData?.user?.id;
      if (!userId) throw new Error('Auth: usuario sin ID devuelto');

      // Insertar perfil
      const { error: profErr } = await supabase.from('profiles').insert({
        id: userId,
        name: form.name.trim(),
        role_id: selRole.id,        
        clinic_id: selClinic.id,    
        phone_number: form.phone || null,
        specialties: form.specialty
          ? form.specialty.split(',').map((s) => s.trim()).filter(Boolean)
          : null,
        is_verified: true,          
      });

      if (profErr) throw new Error(`Profiles: ${profErr.message}`);

      // Limpieza y callback
      setForm({ name: '', email: '', specialty: '', phone: '', password: '' });
      setSelClinic(null);
      setSelRole(null);
      onClose?.();
      onAdded?.(); // refrescar lista en la pantalla padre
    } catch (e) {
      console.log('add vet err:', e);
      setErrorText(e.message || 'No se pudo crear el veterinario.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Nuevo Veterinario</Text>
          <Text style={styles.subtitle}>Completa el formulario</Text>

          <ScrollView
            contentContainerStyle={{ paddingBottom: 10 }}
            showsVerticalScrollIndicator={false}
          >
            <TextInput
              style={styles.input}
              placeholder="Nombre Completo"
              placeholderTextColor={COLORS.textPrimary}
              value={form.name}
              onChangeText={(t) => change('name', t)}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={COLORS.textPrimary}
              autoCapitalize="none"
              keyboardType="email-address"
              value={form.email}
              onChangeText={(t) => change('email', t)}
            />
            <TextInput
              style={styles.input}
              placeholder="Especialidad (ej. Cirugía, Dermato)"
              placeholderTextColor={COLORS.textPrimary}
              value={form.specialty}
              onChangeText={(t) => change('specialty', t)}
            />
            <TextInput
              style={styles.input}
              placeholder="Teléfono"
              placeholderTextColor={COLORS.textPrimary}
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(t) => change('phone', t)}
            />
            <TextInput
              style={styles.input}
              placeholder="Contraseña de Inicio"
              placeholderTextColor={COLORS.textPrimary}
              secureTextEntry
              value={form.password}
              onChangeText={(t) => change('password', t)}
            />

            <Dropdown
              label="Clínica"
              data={clinics}
              selected={selClinic}
              onSelect={setSelClinic}
              placeholder="Selecciona una clínica"
            />
            <Dropdown
              label="Rol"
              data={roles}
              selected={selRole}
              onSelect={setSelRole}
              placeholder="Selecciona un rol"
            />

            {!!errorText && <Text style={styles.error}>{errorText}</Text>}

            <View style={styles.actions}>
              <TouchableOpacity
                disabled={submitting || !canSubmit}
                style={[styles.primaryBtn, (!canSubmit || submitting) && { opacity: 0.6 }]}
                onPress={handleSubmit}
              >
                <Text style={styles.primaryBtnText}>{submitting ? 'Guardando…' : 'Agregar'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  title: {
    textAlign: 'center',
    fontFamily: FONTS.PoppinsBold,
    fontSize: SIZES.h2,
    color: COLORS.white,
  },
  subtitle: {
    textAlign: 'center',
    fontFamily: FONTS.PoppinsRegular,
    fontSize: SIZES.body3,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 46,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    paddingHorizontal: 12,
    color: COLORS.white,
    marginBottom: 10,
  },
  label: {
    fontFamily: FONTS.PoppinsSemiBold,
    fontSize: SIZES.body3,
    color: COLORS.white,
    marginBottom: 6,
  },
  dropdownBlock: {
    marginBottom: 10,
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 46,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.primary,
  },
  selectBtnOpen: {
    borderColor: COLORS.accent,
  },
  selectBtnText: {
    fontFamily: FONTS.PoppinsRegular,
    fontSize: SIZES.body3,
    color: COLORS.white,
  },
  dropdownList: {
    marginTop: 6,
    maxHeight: 180,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.lightGray,
  },
  dropdownItemText: {
    fontFamily: FONTS.PoppinsRegular,
    fontSize: SIZES.body3,
    color: COLORS.black,
  },
  error: {
    marginTop: 4,
    color: COLORS.red,
    fontFamily: FONTS.PoppinsRegular,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 6,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: COLORS.white,
    fontFamily: FONTS.PoppinsSemiBold,
    fontSize: SIZES.body3,
  },
  cancelBtn: {
    backgroundColor: COLORS.red,
    paddingVertical: 12,
    borderRadius: 10,
    paddingHorizontal: 18,
  },
  cancelBtnText: {
    color: COLORS.white,
    fontFamily: FONTS.PoppinsSemiBold,
  },
});
