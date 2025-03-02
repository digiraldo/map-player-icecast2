<?php
session_start();
require_once 'includes/config.php';
require_once 'includes/functions.php';
require_once 'includes/auth.php';

// Si ya está autenticado, redirigir al dashboard
if (isAuthenticated()) {
    header('Location: index.php');
    exit;
}

$error = '';

// Procesar el formulario de login
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = isset($_POST['username']) ? $_POST['username'] : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    
    if (validateLogin($username, $password)) {
        $_SESSION['auth'] = true;
        $_SESSION['user'] = $username;
        $_SESSION['last_activity'] = time();
        
        // Redirigir al dashboard
        header('Location: index.php');
        exit;
    } else {
        $error = 'Usuario o contraseña incorrectos';
    }
}

// Determinar el tema preferido
$theme = isset($_COOKIE['admin_theme']) ? $_COOKIE['admin_theme'] : 'light';
?>
<!DOCTYPE html>
<html lang="es" data-bs-theme="<?php echo $theme; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Panel de Administración | Mapa Emisoras Icecast2</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="css/admin.css">
    <link rel="icon" href="../img/radio-ico.ico" type="image/x-icon">
    <style>
        body {
            height: 100vh;
            display: flex;
            align-items: center;
            background-color: var(--bs-body-bg);
        }
        .form-signin {
            max-width: 400px;
            padding: 1rem;
        }
        .form-floating {
            margin-bottom: 1rem;
        }
    </style>
</head>
<body class="d-flex align-items-center py-4">
    <main class="form-signin w-100 m-auto">
        <div class="card shadow">
            <div class="card-header bg-primary text-white text-center py-3">
                <h4 class="mb-0"><i class="fas fa-broadcast-tower me-2"></i>Mapa Emisoras Icecast2</h4>
                <p class="mb-0">Panel de Administración</p>
            </div>
            <div class="card-body p-4">
                <?php if (!empty($error)): ?>
                    <div class="alert alert-danger alert-dismissible fade show" role="alert">
                        <i class="fas fa-exclamation-circle me-2"></i><?php echo $error; ?>
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                <?php endif; ?>
                
                <form method="post" action="login.php">
                    <div class="form-floating">
                        <input type="text" class="form-control" id="username" name="username" placeholder="Usuario" required autofocus>
                        <label for="username"><i class="fas fa-user me-2"></i>Usuario</label>
                    </div>
                    
                    <div class="form-floating">
                        <input type="password" class="form-control" id="password" name="password" placeholder="Contraseña" required>
                        <label for="password"><i class="fas fa-lock me-2"></i>Contraseña</label>
                    </div>
                    
                    <div class="form-check mb-3 text-start">
                        <input class="form-check-input" type="checkbox" id="remember" name="remember">
                        <label class="form-check-label" for="remember">Recordarme</label>
                        <button type="button" class="btn btn-sm float-end" id="toggleTheme">
                            <i class="fas fa-adjust"></i> Cambiar tema
                        </button>
                    </div>
                    
                    <button class="btn btn-primary w-100 py-2" type="submit">
                        <i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión
                    </button>
                </form>
            </div>
            <div class="card-footer text-center py-2">
                <small>Volver al <a href="../index.html">Mapa Principal</a></small>
            </div>
        </div>
        
        <div class="text-center mt-3 text-muted">
            <small>&copy; <?php echo date('Y'); ?> Map Player Icecast2</small>
        </div>
    </main>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // Toggle theme function
        document.getElementById('toggleTheme').addEventListener('click', function() {
            const html = document.documentElement;
            const currentTheme = html.getAttribute('data-bs-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            html.setAttribute('data-bs-theme', newTheme);
            document.cookie = `admin_theme=${newTheme}; path=/; max-age=31536000`;
        });
    </script>
</body>
</html>
