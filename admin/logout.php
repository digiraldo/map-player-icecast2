<?php
/**
 * Script para cerrar sesión
 */
session_start();
require_once 'includes/auth.php';

// Cerrar la sesión
logout();

// Redirigir a login
header('Location: login.php');
exit;
