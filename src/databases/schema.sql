DROP TABLE IF EXISTS started_task CASCADE;
DROP TABLE IF EXISTS started_procedure CASCADE;
DROP TABLE IF EXISTS task CASCADE;
DROP TABLE IF EXISTS procedure CASCADE;
DROP TABLE IF EXISTS notification CASCADE;
DROP TABLE IF EXISTS gamification CASCADE;
DROP TABLE IF EXISTS employee CASCADE;
DROP TABLE IF EXISTS client CASCADE;
DROP TABLE IF EXISTS person CASCADE;
DROP TABLE IF EXISTS role CASCADE;
-- + DROP ENUMs if necessary (see below)
DO $$ BEGIN
  DROP TYPE IF EXISTS task_difficulty_level CASCADE;
  DROP TYPE IF EXISTS started_procedure_status CASCADE;
  DROP TYPE IF EXISTS started_task_status CASCADE;
END $$;

-- Crear ENUM para niveles de dificultad de las tareas
DO $$ BEGIN
    CREATE TYPE task_difficulty_level AS ENUM ('easy', 'medium', 'hard');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Crear la tabla base Person (Herencia para Client y Employee)
CREATE TABLE IF NOT EXISTS person (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    profile_pic TEXT DEFAULT NULL,
    phone VARCHAR(20) DEFAULT NULL
);

-- Crear tabla Client que hereda de Person
CREATE TABLE IF NOT EXISTS client (
    id INT PRIMARY KEY REFERENCES person(id) ON DELETE CASCADE
);

-- Crear tabla Role
CREATE TABLE IF NOT EXISTS role (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- Crear tabla Employee que hereda de Person
CREATE TABLE IF NOT EXISTS employee (
    id INT PRIMARY KEY REFERENCES person(id) ON DELETE CASCADE,
    role_id INT NOT NULL,
    FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE
);

-- Crear tabla Procedure
CREATE TABLE IF NOT EXISTS procedure (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL
);

-- Crear tabla Task
CREATE TABLE IF NOT EXISTS task (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    xp INT NOT NULL CHECK (xp >= 0),
    procedure_id INT NOT NULL,
    role_id INT NOT NULL,
    estimated_duration_days INT NOT NULL CHECK (estimated_duration_days >= 0),
    difficulty task_difficulty_level NOT NULL,
    FOREIGN KEY (procedure_id) REFERENCES procedure(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE
);

-- Crear ENUM para el estado de los procesos iniciados
DO $$ BEGIN
    CREATE TYPE started_procedure_status AS ENUM ('pending', 'in_progress', 'completed');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Crear tabla de procesos iniciados
CREATE TABLE IF NOT EXISTS started_procedure (
    id SERIAL PRIMARY KEY,
    procedure_id INT NOT NULL,
    client_id INT NOT NULL,
    status started_procedure_status NOT NULL DEFAULT 'pending',
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP NULL,
    FOREIGN KEY (procedure_id) REFERENCES procedure(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES client(id) ON DELETE CASCADE
);

-- Crear ENUM para el estado de las tareas iniciadas
DO $$ BEGIN
    CREATE TYPE started_task_status AS ENUM ('pending', 'completed', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Crear tabla de tareas iniciadas
CREATE TABLE IF NOT EXISTS started_task (
    id SERIAL PRIMARY KEY,
    started_procedure_id INT NOT NULL,
    task_id INT NOT NULL,
    employee_id INT NOT NULL,
    status started_task_status NOT NULL DEFAULT 'pending',
    document_uploaded TEXT CHECK (document_uploaded ILIKE '%.pdf' OR document_uploaded IS NULL),
    rejected_reason TEXT DEFAULT NULL,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP NULL,
    FOREIGN KEY (started_procedure_id) REFERENCES started_procedure(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES task(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE
);

-- Crear tabla de gamificación
CREATE TABLE IF NOT EXISTS gamification (
    id SERIAL PRIMARY KEY,
    employee_id INT NOT NULL UNIQUE,
    xp_total INT NOT NULL CHECK (xp_total >= 0) DEFAULT 0,
    completed_tasks INT NOT NULL CHECK (completed_tasks >= 0) DEFAULT 0,
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE
);

-- Crear tabla de notificaciones
CREATE TABLE IF NOT EXISTS notification (
    id SERIAL PRIMARY KEY,
    person_id INT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (person_id) REFERENCES person(id) ON DELETE CASCADE
);

-- Crear tabla de tokens de restablecimiento de contraseña
CREATE TABLE IF NOT EXISTS password_reset_token (
  id SERIAL PRIMARY KEY,
  person_id INT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  FOREIGN KEY (person_id) REFERENCES person(id) ON DELETE CASCADE
);

INSERT INTO role (name, description) VALUES
  ('Administrador', 'Encargado de gestionar el sistema y los usuarios.');

  -- Insertar un administrador
INSERT INTO person (username, email, password)
VALUES ('admin', 'admin@workgam.com', '$2a$10$jMafKXGfYF.ulcehq6pWNe/M8ry7d1RBGC3.gC6zahHmkIWHXE6BO');

-- Luego insertamos en employee (usamos un SELECT para obtener id del rol 'admin')
INSERT INTO employee (id, role_id) 
VALUES (
  (SELECT id FROM person WHERE username = 'admin'),
  (SELECT id FROM role WHERE name = 'Administrador')
);
