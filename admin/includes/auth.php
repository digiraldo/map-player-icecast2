<?php
/**
 * Funciones de autenticación para el panel de administración
 */

/**
 * Verifica si el usuario está autenticado
 * @return bool
 */
function isAuthenticated() {
    // Verificar si existe la sesión de autenticación
    if (!isset($_SESSION['auth']) || $_SESSION['auth'] !== true) {
        return false;
    }
    
    // Verificar tiempo de inactividad (30 minutos)
    $inactive = 1800; // 30 minutos
    if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > $inactive)) {
        // La sesión ha expirado
        session_unset();
        session_destroy();
        return false;
    }
    
    // Actualizar tiempo de última actividad
    $_SESSION['last_activity'] = time();
    
    return true;
}

/**
 * Valida las credenciales de acceso
 * @param string $username
 * @param string $password
 * @return bool
 */
function validateLogin($username, $password) {
    // Esta es una implementación básica. En un entorno de producción,
    // deberías usar un sistema más seguro con hashing y almacenamiento en BD.
    
    // Credenciales fijas para este ejemplo
    $validUsername = 'admin';
    $validPassword = 'admin123';
    
    return ($username === $validUsername && $password === $validPassword);
}

/**
 * Cierra la sesión del usuario
 */
function logout() {
    // Destruir todas las variables de sesión
    $_SESSION = array();
    
    // Si se desea destruir completamente la sesión, eliminar también la cookie de sesión
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params["path"],
            $params["domain"],
            $params["secure"],
            $params["httponly"]
        );
    }
    
    // Finalmente, destruir la sesión
    session_destroy();
}
