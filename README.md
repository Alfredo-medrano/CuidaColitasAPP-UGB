# CuidaColitas 🐾

Una aplicación móvil para la gestión de citas y expedientes médicos veterinarios, diseñada para conectar a dueños de mascotas con profesionales de la salud animal de manera eficiente y ordenada.

## ✨ Acerca del Proyecto

**CuidaColitas** nace de la necesidad de centralizar la información médica de nuestras mascotas y simplificar la comunicación entre los clientes y las clínicas veterinarias. La aplicación cuenta con dos roles principales, cada uno con una interfaz y funcionalidades pensadas para sus necesidades específicas.

El objetivo es ofrecer una plataforma intuitiva donde los dueños puedan llevar un control detallado de la salud de sus compañeros peludos, y los veterinarios puedan gestionar su trabajo diario de forma digital y sin complicaciones.

---

## 🚀 Características Principales

### Para Dueños de Mascotas (Rol Cliente)
* **Gestión de Mascotas:** Registra el perfil de cada una de tus mascotas con su información esencial (nombre, raza, edad, etc.).
* **Historial Médico Digital:** Accede al expediente completo de tus mascotas, incluyendo visitas pasadas, vacunas aplicadas y medicamentos recetados.
* **Solicitud de Citas:** Agenda nuevas citas con tu veterinario de confianza de forma rápida y sencilla.
* **Notificaciones y Recordatorios:** Recibe alertas sobre tus próximas citas o vacunas pendientes.
* **Comunicación Directa:** Contacta a la clínica para resolver dudas o reprogramar una cita.

### Para Profesionales (Rol Veterinario)
* **Gestión de Pacientes:** Administra la lista de tus pacientes y accede a sus perfiles e historiales médicos con un solo toque.
* **Agenda del Día:** Visualiza todas las citas programadas para el día, optimizando tu tiempo y organización.
* **Expedientes Clínicos:** Registra nuevas visitas, diagnósticos, vacunas y tratamientos directamente en el perfil del paciente.
* **Administración de Citas:** Acepta o sugiere cambios en las solicitudes de citas de tus clientes.

---

## 💻 Tecnologías Utilizadas

* **Frontend:** React Native con Expo
* **Backend & Base de Datos:** Supabase (PostgreSQL)
* **Autenticación:** Supabase Auth

---

## 🛠️ Cómo Empezar

Sigue estos pasos para clonar y ejecutar el proyecto en tu entorno de desarrollo local.

### Pre-requisitos

Asegúrate de tener instalado lo siguiente en tu sistema:
* [Node.js](https://nodejs.org/) (versión LTS recomendada)
* [Git](https://git-scm.com/)
* npm incluido en node
* Tener una cuenta en [Supabase](https://supabase.com/) para crear tu propio proyecto de backend.

### Instalación

1.  **Clona el repositorio:**
    ```bash
    git clone [https://github.com/tu-usuario/cuida-colitas.git](https://github.com/tu-usuario/cuida-colitas.git)
    ```

2.  **Navega al directorio del proyecto:**
    ```bash
    cd cuida-colitas
    ```

3.  **Instala las dependencias:**
    ```bash
    npm install
    ```

4.  **Configura las variables de entorno:**
    * Crea un archivo llamado `.env` en la raíz del proyecto.
    * Ve a tu proyecto de Supabase, a la sección `Settings` > `API`.
    * Copia tu **URL** y tu **anon public key**.
    * Pega las claves en tu archivo `.env` de la siguiente manera:

    ```env
    EXPO_PUBLIC_SUPABASE_URL=URL_DE_TU_PROYECTO_SUPABASE
    EXPO_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_PUBLIC_KEY
    ```

5.  **Inicia la aplicación:**
    ```bash
    npx expo start
    ```
    Se abrirá una ventana en tu navegador con un código QR. Escanéalo con la aplicación **Expo Go** en tu teléfono (iOS o Android) para ver la app en funcionamiento.

---

## 📄 Estado del Proyecto

Actualmente, el proyecto se encuentra en fase de **desarrollo activo**. Las funcionalidades principales están siendo implementadas y mejoradas.
