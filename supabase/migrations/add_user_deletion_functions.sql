-- Agregar columna is_active a profiles para soft delete
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Crear índice para mejorar queries que filtran por is_active
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

-- Función para desactivar usuario (soft delete)
CREATE OR REPLACE FUNCTION deactivate_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles 
  SET is_active = false, 
      updated_at = NOW()
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para reactivar usuario
CREATE OR REPLACE FUNCTION reactivate_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles 
  SET is_active = true, 
      updated_at = NOW()
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para borrado permanente de veterinario
CREATE OR REPLACE FUNCTION delete_veterinarian_permanently(vet_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Eliminar citas donde es veterinario
  DELETE FROM appointments WHERE vet_id = vet_id;
  
  -- Eliminar perfil
  DELETE FROM profiles WHERE id = vet_id;
  
  -- Nota: El usuario de auth.users se mantiene por seguridad
  -- Si se desea eliminar también de auth: await supabase.auth.admin.deleteUser(vet_id)
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para borrado permanente de cliente
CREATE OR REPLACE FUNCTION delete_client_permanently(client_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  pet_record RECORD;
BEGIN
  -- 1. Obtener todas las mascotas del cliente
  FOR pet_record IN SELECT id FROM pets WHERE owner_id = client_id
  LOOP
    -- Eliminar citas de cada mascota
    DELETE FROM appointments WHERE pet_id = pet_record.id;
    
    -- Eliminar archivos/attachments de la mascota (si hay tabla)
    -- DELETE FROM attachments WHERE pet_id = pet_record.id;
  END LOOP;
  
  -- 2. Eliminar todas las mascotas del cliente
  DELETE FROM pets WHERE owner_id = client_id;
  
  -- 3. Eliminar perfil del cliente
  DELETE FROM profiles WHERE id = client_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grants para que los usuarios puedan ejecutar estas funciones
GRANT EXECUTE ON FUNCTION deactivate_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reactivate_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_veterinarian_permanently(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_client_permanently(UUID) TO authenticated;
