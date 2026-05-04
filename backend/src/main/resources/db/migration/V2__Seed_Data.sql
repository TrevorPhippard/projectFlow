-- V2__Seed_Data.sql
-- Initial roles
INSERT INTO roles (name, description) VALUES
    ('ROLE_ADMIN', 'System administrator with full access'),
    ('ROLE_USER', 'Standard user with project access')
ON CONFLICT (name) DO NOTHING;

-- Admin user (password: Admin@123)
INSERT INTO users (email, username, password_hash, full_name, provider, email_verified, account_enabled)
VALUES (
    'admin@projectflow.com',
    'admin',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfF3FTNS3ZJTFAO',
    'System Admin',
    'LOCAL',
    TRUE,
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Demo user (password: Demo@123)
INSERT INTO users (email, username, password_hash, full_name, bio, provider, email_verified, account_enabled)
VALUES (
    'demo@projectflow.com',
    'demouser',
    '$2a$12$eImiTXuWVxfM37uY4JANjQ==.0/1FcLWkNILVAbO.lJFXXRnpgQBm6',
    'Demo User',
    'Software developer passionate about clean code',
    'LOCAL',
    TRUE,
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Assign roles
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'admin@projectflow.com' AND r.name = 'ROLE_ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'admin@projectflow.com' AND r.name = 'ROLE_USER'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'demo@projectflow.com' AND r.name = 'ROLE_USER'
ON CONFLICT DO NOTHING;

-- Sample project
INSERT INTO projects (name, description, key, status, color, owner_id)
SELECT
    'ProjectFlow Demo',
    'A demonstration project showcasing all ProjectFlow features including task management, kanban boards, and team collaboration.',
    'PFD',
    'ACTIVE',
    '#6366f1',
    u.id
FROM users u WHERE u.email = 'admin@projectflow.com'
ON CONFLICT (key) DO NOTHING;

-- Add demo user as project member
INSERT INTO project_members (project_id, user_id, role)
SELECT p.id, u.id, 'ADMIN'
FROM projects p, users u
WHERE p.key = 'PFD' AND u.email = 'admin@projectflow.com'
ON CONFLICT DO NOTHING;

INSERT INTO project_members (project_id, user_id, role)
SELECT p.id, u.id, 'MEMBER'
FROM projects p, users u
WHERE p.key = 'PFD' AND u.email = 'demo@projectflow.com'
ON CONFLICT DO NOTHING;

-- Sample tasks
INSERT INTO tasks (title, description, status, priority, project_id, reporter_id, position, story_points)
SELECT
    'Set up CI/CD pipeline',
    'Configure GitHub Actions for automated testing and deployment to production environment.',
    'TODO',
    'HIGH',
    p.id,
    u.id,
    1,
    8
FROM projects p, users u
WHERE p.key = 'PFD' AND u.email = 'admin@projectflow.com';

INSERT INTO tasks (title, description, status, priority, project_id, reporter_id, position, story_points)
SELECT
    'Design system architecture',
    'Create comprehensive architecture documentation including data flow diagrams and API contracts.',
    'TODO',
    'HIGH',
    p.id,
    u.id,
    2,
    13
FROM projects p, users u
WHERE p.key = 'PFD' AND u.email = 'admin@projectflow.com';

INSERT INTO tasks (title, description, status, priority, project_id, reporter_id, position, story_points)
SELECT
    'Implement user authentication',
    'Build JWT-based auth with refresh tokens, OAuth2 Google login, and role-based access control.',
    'IN_PROGRESS',
    'HIGH',
    p.id,
    u.id,
    1,
    13
FROM projects p, users u
WHERE p.key = 'PFD' AND u.email = 'admin@projectflow.com';

INSERT INTO tasks (title, description, status, priority, project_id, reporter_id, position, story_points)
SELECT
    'Create kanban board UI',
    'Implement drag-and-drop kanban board using Angular CDK with real-time updates.',
    'IN_PROGRESS',
    'MEDIUM',
    p.id,
    u.id,
    2,
    8
FROM projects p, users u
WHERE p.key = 'PFD' AND u.email = 'admin@projectflow.com';

INSERT INTO tasks (title, description, status, priority, project_id, reporter_id, position, story_points)
SELECT
    'Database schema design',
    'Design normalized PostgreSQL schema with proper indexes, constraints and foreign keys.',
    'DONE',
    'HIGH',
    p.id,
    u.id,
    1,
    5
FROM projects p, users u
WHERE p.key = 'PFD' AND u.email = 'admin@projectflow.com';

INSERT INTO tasks (title, description, status, priority, project_id, reporter_id, position, story_points)
SELECT
    'Setup Docker environment',
    'Configure Docker and docker-compose for local development and production deployment.',
    'DONE',
    'MEDIUM',
    p.id,
    u.id,
    2,
    3
FROM projects p, users u
WHERE p.key = 'PFD' AND u.email = 'admin@projectflow.com';
