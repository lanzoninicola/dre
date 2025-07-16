-- ====================================
-- SCRIPT DE SEED - FINANCEFLOW DATABASE (PostgreSQL)
-- NOVO SCHEMA SIMPLIFICADO
-- ====================================

-- Limpar dados existentes (cuidado em produção!)
DELETE FROM audit_log;
DELETE FROM bank_transactions;
DELETE FROM dre;
DELETE FROM bank_statements;
DELETE FROM import_logs;
DELETE FROM accounts;
DELETE FROM user_company_access;
DELETE FROM companies;
DELETE FROM users;
DELETE FROM dre_group;
DELETE FROM accounting_firms;

-- ====================================
-- 1. GRUPOS DRE
-- ====================================
INSERT INTO dre_group (id, name, "order", type) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Receita Bruta', 1, 'receita'),
('550e8400-e29b-41d4-a716-446655440002', 'Deduções da Receita', 2, 'despesa'),
('550e8400-e29b-41d4-a716-446655440003', 'Custo dos Produtos Vendidos (CPV)', 3, 'despesa'),
('550e8400-e29b-41d4-a716-446655440004', 'Despesas Administrativas', 4, 'despesa'),
('550e8400-e29b-41d4-a716-446655440005', 'Despesas Comerciais', 5, 'despesa'),
('550e8400-e29b-41d4-a716-446655440006', 'Despesas Financeiras', 6, 'despesa'),
('550e8400-e29b-41d4-a716-446655440007', 'Receitas Financeiras', 7, 'receita'),
('550e8400-e29b-41d4-a716-446655440008', 'Outras Receitas Operacionais', 8, 'receita'),
('550e8400-e29b-41d4-a716-446655440009', 'Outras Despesas Operacionais', 9, 'despesa');

-- ====================================
-- 2. FIRMAS CONTÁBEIS
-- ====================================
INSERT INTO accounting_firms (id, name, cnpj, email, phone, is_active, is_autonomous, created_at, updated_at) VALUES
-- Escritórios grandes
('550e8400-e29b-41d4-a716-446655440010', 'Contabilidade Silva & Associados', '12.345.678/0001-10', 'contato@silva.com.br', '(11) 3456-7890', true, false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440011', 'Contabilidade Moderna Ltda', '23.456.789/0001-11', 'contato@moderna.com.br', '(11) 3567-8901', true, false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440012', 'JF Assessoria Contábil', '34.567.890/0001-12', 'contato@jfassessoria.com.br', '(11) 3678-9012', true, false, NOW(), NOW()),

-- Contadores autônomos
('550e8400-e29b-41d4-a716-446655440013', 'João Santos - Contador', NULL, 'joao@contador.com.br', '(11) 9876-5432', true, true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440014', 'Maria Oliveira - CRC', NULL, 'maria@contadora.com.br', '(11) 9765-4321', true, true, NOW(), NOW());

-- ====================================
-- 3. USUÁRIOS
-- ====================================
-- Senha: "123456" em bcrypt hash
-- $2b$10$KQA1Z83fKPpNuU3rX2XVQerhLSTpovfM8Uy9.WlF3GBWXs4SuAjnK



-- ADMINS DE FIRMAS CONTÁBEIS (admin + accountingFirm)
INSERT INTO users (id, email, password, name, role, type, is_active, can_manage_users, can_create_companies, accounting_firm_id, last_login_at, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440020', 'admin@silva.com.br', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Roberto Silva', 'admin', 'accountingFirm', true, true, true, '550e8400-e29b-41d4-a716-446655440010', NOW() - INTERVAL '2 hours', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440021', 'admin@moderna.com.br', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ana Moderna', 'admin', 'accountingFirm', true, true, true, '550e8400-e29b-41d4-a716-446655440011', NOW() - INTERVAL '1 day', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440022', 'admin@jfassessoria.com.br', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'José Fernando', 'admin', 'accountingFirm', true, true, true, '550e8400-e29b-41d4-a716-446655440012', NOW() - INTERVAL '3 hours', NOW(), NOW()),

-- CONTADORES AUTÔNOMOS (admin + accountingFirm)
('550e8400-e29b-41d4-a716-446655440023', 'joao@contador.com.br', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'João Santos', 'admin', 'accountingFirm', true, true, true, '550e8400-e29b-41d4-a716-446655440013', NOW() - INTERVAL '4 hours', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440024', 'maria@contadora.com.br', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Maria Oliveira', 'admin', 'accountingFirm', true, true, true, '550e8400-e29b-41d4-a716-446655440014', NOW() - INTERVAL '6 hours', NOW(), NOW()),

-- CONTADORES FUNCIONÁRIOS (operator + accountingFirm)
('550e8400-e29b-41d4-a716-446655440025', 'contador1@silva.com.br', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Carlos Souza', 'operator', 'accountingFirm', true, false, false, '550e8400-e29b-41d4-a716-446655440010', NOW() - INTERVAL '1 hour', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440026', 'contador2@silva.com.br', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Fernanda Lima', 'operator', 'accountingFirm', true, false, false, '550e8400-e29b-41d4-a716-446655440010', NOW() - INTERVAL '30 minutes', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440027', 'contador@moderna.com.br', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Pedro Costa', 'operator', 'accountingFirm', true, false, false, '550e8400-e29b-41d4-a716-446655440011', NOW() - INTERVAL '2 hours', NOW(), NOW());

-- ====================================
-- 4. EMPRESAS
-- ====================================
-- Primeiro vamos criar usuários donos das empresas (admin + company)
INSERT INTO users (id, email, password, name, role, type, is_active, can_manage_users, can_create_companies, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440030', 'admin@techsolutions.com.br', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ricardo Santos', 'admin', 'company', true, true, false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440031', 'admin@comercialuniao.com.br', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Luiza Ferreira', 'admin', 'company', true, true, false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440032', 'admin@inovaconsultoria.com.br', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Marcos Oliveira', 'admin', 'company', true, true, false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440033', 'admin@distribuidoralogistica.com.br', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Carla Silva', 'admin', 'company', true, true, false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440034', 'admin@construtoraplanalto.com.br', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Paulo Mendes', 'admin', 'company', true, true, false, NOW(), NOW());



-- Agora criamos as empresas
INSERT INTO companies (id, name, cnpj, email, phone,  accounting_firm_id, is_active, subscription_plan, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440040', 'Tech Solutions Ltda', '12.345.678/0001-90', 'contato@techsolutions.com.br', '(11) 3123-4567',  '550e8400-e29b-41d4-a716-446655440010', true, 'basic', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440041', 'Comercial União S.A.', '23.456.789/0001-01', 'contato@comercialuniao.com.br', '(11) 3234-5678', '550e8400-e29b-41d4-a716-446655440010', true, 'basic', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440042', 'Inova Consultoria ME', '34.567.890/0001-12', 'contato@inovaconsultoria.com.br', '(11) 3345-6789',  '550e8400-e29b-41d4-a716-446655440011', true, 'basic', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440043', 'Distribuidora Logística Ltda', '45.678.901/0001-23', 'contato@distribuidoralogistica.com.br', '(11) 3456-7890',  '550e8400-e29b-41d4-a716-446655440011', true, 'basic', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440044', 'Construtora Planalto Ltda', '56.789.012/0001-34', 'contato@construtoraplanalto.com.br', '(11) 3567-8901',  '550e8400-e29b-41d4-a716-446655440012', true, 'basic', NOW(), NOW());

-- Atualizar company_id dos usuários donos
UPDATE users SET company_id = '550e8400-e29b-41d4-a716-446655440040' WHERE id = '550e8400-e29b-41d4-a716-446655440030';
UPDATE users SET company_id = '550e8400-e29b-41d4-a716-446655440041' WHERE id = '550e8400-e29b-41d4-a716-446655440031';
UPDATE users SET company_id = '550e8400-e29b-41d4-a716-446655440042' WHERE id = '550e8400-e29b-41d4-a716-446655440032';
UPDATE users SET company_id = '550e8400-e29b-41d4-a716-446655440043' WHERE id = '550e8400-e29b-41d4-a716-446655440033';
UPDATE users SET company_id = '550e8400-e29b-41d4-a716-446655440044' WHERE id = '550e8400-e29b-41d4-a716-446655440034';

-- ====================================
-- 5. USUÁRIOS FUNCIONÁRIOS DAS EMPRESAS (operator + company)
-- ====================================
INSERT INTO users (id, email, password, name, role, type, is_active, can_manage_users, can_create_companies, company_id, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440035', 'financeiro@techsolutions.com.br', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ana Financeiro', 'operator', 'company', true, false, false, '550e8400-e29b-41d4-a716-446655440040', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440036', 'operador@comercialuniao.com.br', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'José Operador', 'operator', 'company', true, false, false, '550e8400-e29b-41d4-a716-446655440041', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440037', 'assistente@inovaconsultoria.com.br', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Maria Assistente', 'operator', 'company', true, false, false, '550e8400-e29b-41d4-a716-446655440042', NOW(), NOW());

-- ====================================
-- 6. CONTROLE DE ACESSO (UserCompanyAccess)
-- ====================================
-- Contadores têm acesso às empresas que atendem
INSERT INTO user_company_access (id, user_id, company_id, permissions, granted_by_user_id, granted_at, is_active) VALUES
-- Contador Carlos da Silva tem acesso completo às empresas da firma
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440040', ARRAY['read', 'write', 'import', 'export', 'dre_generate'], '550e8400-e29b-41d4-a716-446655440020', NOW(), true),
('550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440041', ARRAY['read', 'write', 'import', 'export', 'dre_generate'], '550e8400-e29b-41d4-a716-446655440020', NOW(), true),

-- Contadora Fernanda tem acesso limitado
('550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440040', ARRAY['read', 'write'], '550e8400-e29b-41d4-a716-446655440020', NOW(), true),

-- Contador Pedro da Moderna tem acesso às empresas da sua firma
('550e8400-e29b-41d4-a716-446655440053', '550e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440042', ARRAY['read', 'write', 'import', 'export', 'dre_generate'], '550e8400-e29b-41d4-a716-446655440021', NOW(), true),
('550e8400-e29b-41d4-a716-446655440054', '550e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440043', ARRAY['read', 'write', 'import', 'export', 'dre_generate'], '550e8400-e29b-41d4-a716-446655440021', NOW(), true);

-- ====================================
-- 7. PLANO DE CONTAS
-- ====================================

-- Tech Solutions Ltda
INSERT INTO accounts (id, company_id, name, code, type, dre_group_id, is_active, created_at) VALUES
-- Receitas
('550e8400-e29b-41d4-a716-446655440060', '550e8400-e29b-41d4-a716-446655440040', 'Vendas de Software', '3.1.01.001', 'receita', '550e8400-e29b-41d4-a716-446655440001', true, NOW()),
('550e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440040', 'Serviços de Consultoria', '3.1.01.002', 'receita', '550e8400-e29b-41d4-a716-446655440001', true, NOW()),
('550e8400-e29b-41d4-a716-446655440062', '550e8400-e29b-41d4-a716-446655440040', 'Manutenção de Sistemas', '3.1.01.003', 'receita', '550e8400-e29b-41d4-a716-446655440001', true, NOW()),

-- Despesas
('550e8400-e29b-41d4-a716-446655440063', '550e8400-e29b-41d4-a716-446655440040', 'Salários e Encargos', '3.3.01.001', 'despesa', '550e8400-e29b-41d4-a716-446655440004', true, NOW()),
('550e8400-e29b-41d4-a716-446655440064', '550e8400-e29b-41d4-a716-446655440040', 'Aluguel do Escritório', '3.3.01.002', 'despesa', '550e8400-e29b-41d4-a716-446655440004', true, NOW()),
('550e8400-e29b-41d4-a716-446655440065', '550e8400-e29b-41d4-a716-446655440040', 'Material de Escritório', '3.3.01.003', 'despesa', '550e8400-e29b-41d4-a716-446655440004', true, NOW()),
('550e8400-e29b-41d4-a716-446655440066', '550e8400-e29b-41d4-a716-446655440040', 'Marketing Digital', '3.3.02.001', 'despesa', '550e8400-e29b-41d4-a716-446655440005', true, NOW()),
('550e8400-e29b-41d4-a716-446655440067', '550e8400-e29b-41d4-a716-446655440040', 'Juros Bancários', '3.3.03.001', 'despesa', '550e8400-e29b-41d4-a716-446655440006', true, NOW()),

-- Receitas Financeiras
('550e8400-e29b-41d4-a716-446655440068', '550e8400-e29b-41d4-a716-446655440040', 'Rendimentos de Aplicação', '3.1.04.001', 'receita', '550e8400-e29b-41d4-a716-446655440007', true, NOW()),

-- Contas de Balanço
('550e8400-e29b-41d4-a716-446655440069', '550e8400-e29b-41d4-a716-446655440040', 'Banco Conta Corrente', '1.1.01.001', 'ativo', NULL, true, NOW());

-- Comercial União S.A.
INSERT INTO accounts (id, company_id, name, code, type, dre_group_id, is_active, created_at) VALUES
-- Receitas
('550e8400-e29b-41d4-a716-446655440070', '550e8400-e29b-41d4-a716-446655440041', 'Vendas de Mercadorias', '3.1.01.001', 'receita', '550e8400-e29b-41d4-a716-446655440001', true, NOW()),
('550e8400-e29b-41d4-a716-446655440071', '550e8400-e29b-41d4-a716-446655440041', 'Vendas de Serviços', '3.1.01.002', 'receita', '550e8400-e29b-41d4-a716-446655440001', true, NOW()),

-- Custos
('550e8400-e29b-41d4-a716-446655440072', '550e8400-e29b-41d4-a716-446655440041', 'Custo das Mercadorias Vendidas', '3.2.01.001', 'despesa', '550e8400-e29b-41d4-a716-446655440003', true, NOW()),

-- Despesas
('550e8400-e29b-41d4-a716-446655440073', '550e8400-e29b-41d4-a716-446655440041', 'Salários', '3.3.01.001', 'despesa', '550e8400-e29b-41d4-a716-446655440004', true, NOW()),
('550e8400-e29b-41d4-a716-446655440074', '550e8400-e29b-41d4-a716-446655440041', 'Energia Elétrica', '3.3.01.002', 'despesa', '550e8400-e29b-41d4-a716-446655440004', true, NOW()),
('550e8400-e29b-41d4-a716-446655440075', '550e8400-e29b-41d4-a716-446655440041', 'Combustível', '3.3.02.001', 'despesa', '550e8400-e29b-41d4-a716-446655440005', true, NOW()),
('550e8400-e29b-41d4-a716-446655440076', '550e8400-e29b-41d4-a716-446655440041', 'Comissões de Vendas', '3.3.02.002', 'despesa', '550e8400-e29b-41d4-a716-446655440005', true, NOW()),

-- Contas de Balanço
('550e8400-e29b-41d4-a716-446655440077', '550e8400-e29b-41d4-a716-446655440041', 'Banco Conta Corrente', '1.1.01.001', 'ativo', NULL, true, NOW());

-- Mais contas para as outras empresas...
INSERT INTO accounts (id, company_id, name, code, type, dre_group_id, is_active, created_at) VALUES
-- Inova Consultoria
('550e8400-e29b-41d4-a716-446655440080', '550e8400-e29b-41d4-a716-446655440042', 'Consultoria Empresarial', '3.1.01.001', 'receita', '550e8400-e29b-41d4-a716-446655440001', true, NOW()),
('550e8400-e29b-41d4-a716-446655440081', '550e8400-e29b-41d4-a716-446655440042', 'Treinamentos', '3.1.01.002', 'receita', '550e8400-e29b-41d4-a716-446655440001', true, NOW()),
('550e8400-e29b-41d4-a716-446655440082', '550e8400-e29b-41d4-a716-446655440042', 'Honorários Profissionais', '3.3.01.001', 'despesa', '550e8400-e29b-41d4-a716-446655440004', true, NOW()),
('550e8400-e29b-41d4-a716-446655440083', '550e8400-e29b-41d4-a716-446655440042', 'Telefone e Internet', '3.3.01.002', 'despesa', '550e8400-e29b-41d4-a716-446655440004', true, NOW()),
('550e8400-e29b-41d4-a716-446655440084', '550e8400-e29b-41d4-a716-446655440042', 'Propaganda e Publicidade', '3.3.02.001', 'despesa', '550e8400-e29b-41d4-a716-446655440005', true, NOW()),
('550e8400-e29b-41d4-a716-446655440085', '550e8400-e29b-41d4-a716-446655440042', 'Banco Conta Corrente', '1.1.01.001', 'ativo', NULL, true, NOW()),

-- Distribuidora Logística
('550e8400-e29b-41d4-a716-446655440086', '550e8400-e29b-41d4-a716-446655440043', 'Receita de Transporte', '3.1.01.001', 'receita', '550e8400-e29b-41d4-a716-446655440001', true, NOW()),
('550e8400-e29b-41d4-a716-446655440087', '550e8400-e29b-41d4-a716-446655440043', 'Armazenagem', '3.1.01.002', 'receita', '550e8400-e29b-41d4-a716-446655440001', true, NOW()),
('550e8400-e29b-41d4-a716-446655440088', '550e8400-e29b-41d4-a716-446655440043', 'Combustível e Lubrificantes', '3.3.01.001', 'despesa', '550e8400-e29b-41d4-a716-446655440004', true, NOW()),
('550e8400-e29b-41d4-a716-446655440089', '550e8400-e29b-41d4-a716-446655440043', 'Manutenção de Veículos', '3.3.01.002', 'despesa', '550e8400-e29b-41d4-a716-446655440004', true, NOW()),
('550e8400-e29b-41d4-a716-446655440090', '550e8400-e29b-41d4-a716-446655440043', 'Seguros', '3.3.01.003', 'despesa', '550e8400-e29b-41d4-a716-446655440004', true, NOW()),
('550e8400-e29b-41d4-a716-446655440091', '550e8400-e29b-41d4-a716-446655440043', 'Banco Conta Corrente', '1.1.01.001', 'ativo', NULL, true, NOW()),

-- Construtora Planalto
('550e8400-e29b-41d4-a716-446655440092', '550e8400-e29b-41d4-a716-446655440044', 'Receita de Obras', '3.1.01.001', 'receita', '550e8400-e29b-41d4-a716-446655440001', true, NOW()),
('550e8400-e29b-41d4-a716-446655440093', '550e8400-e29b-41d4-a716-446655440044', 'Projetos Arquitetônicos', '3.1.01.002', 'receita', '550e8400-e29b-41d4-a716-446655440001', true, NOW()),
('550e8400-e29b-41d4-a716-446655440094', '550e8400-e29b-41d4-a716-446655440044', 'Custo de Materiais', '3.2.01.001', 'despesa', '550e8400-e29b-41d4-a716-446655440003', true, NOW()),
('550e8400-e29b-41d4-a716-446655440095', '550e8400-e29b-41d4-a716-446655440044', 'Mão de Obra', '3.2.01.002', 'despesa', '550e8400-e29b-41d4-a716-446655440003', true, NOW()),
('550e8400-e29b-41d4-a716-446655440096', '550e8400-e29b-41d4-a716-446655440044', 'Equipamentos e Ferramentas', '3.3.01.001', 'despesa', '550e8400-e29b-41d4-a716-446655440004', true, NOW()),
('550e8400-e29b-41d4-a716-446655440097', '550e8400-e29b-41d4-a716-446655440044', 'Banco Conta Corrente', '1.1.01.001', 'ativo', NULL, true, NOW());

-- ====================================
-- 8. LOGS DE IMPORTAÇÃO
-- ====================================
INSERT INTO import_logs (id, company_id, user_id, file_name, file_size, hash, status, transactions_count, imported_at) VALUES
('550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440030', 'extrato_dezembro_2024.ofx', 245678, 'hash123abc456def789', 'completed', 5, NOW() - INTERVAL '15 days'),
('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440030', 'extrato_janeiro_2025.ofx', 198432, 'hash789ghi012jkl345', 'completed', 5, NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440031', 'extrato_dezembro_2024.ofx', 312456, 'hash345mno678pqr901', 'completed', 6, NOW() - INTERVAL '10 days'),
('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440032', 'extrato_novembro_2024.ofx', 167890, 'hash456def789abc123', 'completed', 5, NOW() - INTERVAL '20 days'),
('550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440033', 'extrato_dezembro_2024.ofx', 234567, 'hash789abc123def456', 'completed', 6, NOW() - INTERVAL '12 days');

-- ====================================
-- 9. EXTRATOS BANCÁRIOS
-- ====================================
INSERT INTO bank_statements (id, company_id, hash, file_name, account_number, bank_name, period_start, period_end, imported_at) VALUES
('550e8400-e29b-41d4-a716-446655440110', '550e8400-e29b-41d4-a716-446655440040', 'hash123abc456def789', 'extrato_dezembro_2024.ofx', '12345-6', 'Banco do Brasil', '2024-12-01', '2024-12-31', NOW() - INTERVAL '15 days'),
('550e8400-e29b-41d4-a716-446655440111', '550e8400-e29b-41d4-a716-446655440040', 'hash789ghi012jkl345', 'extrato_janeiro_2025.ofx', '12345-6', 'Banco do Brasil', '2025-01-01', '2025-01-31', NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440112', '550e8400-e29b-41d4-a716-446655440041', 'hash345mno678pqr901', 'extrato_dezembro_2024.ofx', '54321-9', 'Itaú Unibanco', '2024-12-01', '2024-12-31', NOW() - INTERVAL '10 days'),
('550e8400-e29b-41d4-a716-446655440113', '550e8400-e29b-41d4-a716-446655440042', 'hash456def789abc123', 'extrato_novembro_2024.ofx', '67890-3', 'Bradesco', '2024-11-01', '2024-11-30', NOW() - INTERVAL '20 days'),
('550e8400-e29b-41d4-a716-446655440114', '550e8400-e29b-41d4-a716-446655440043', 'hash789abc123def456', 'extrato_dezembro_2024.ofx', '98765-4', 'Santander', '2024-12-01', '2024-12-31', NOW() - INTERVAL '12 days');

-- ====================================
-- 10. TRANSAÇÕES BANCÁRIAS
-- ====================================

-- Tech Solutions - Dezembro 2024
INSERT INTO bank_transactions (id, statement_id, import_log_id, date, description, amount, transaction_type, document_number, transaction_hash, account_id, classified_by_user_id, classified_at, is_classified, is_reconciled, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440120', '550e8400-e29b-41d4-a716-446655440110', '550e8400-e29b-41d4-a716-446655440100', '2024-12-05', 'PAGAMENTO CLIENTE XYZ LTDA', 25000.00, 'credit', 'DOC001', MD5('2024-12-05_25000.00_PAGAMENTO CLIENTE XYZ LTDA_12345-6'), '550e8400-e29b-41d4-a716-446655440060', '550e8400-e29b-41d4-a716-446655440025', NOW() - INTERVAL '14 days', true, true, NOW() - INTERVAL '15 days'),
('550e8400-e29b-41d4-a716-446655440121', '550e8400-e29b-41d4-a716-446655440110', '550e8400-e29b-41d4-a716-446655440100', '2024-12-10', 'CONSULTORIA EMPRESA ABC', 8500.00, 'credit', 'DOC002', MD5('2024-12-10_8500.00_CONSULTORIA EMPRESA ABC_12345-6'), '550e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440025', NOW() - INTERVAL '14 days', true, true, NOW() - INTERVAL '15 days'),
('550e8400-e29b-41d4-a716-446655440122', '550e8400-e29b-41d4-a716-446655440110', '550e8400-e29b-41d4-a716-446655440100', '2024-12-15', 'PAGAMENTO SALARIOS', -15000.00, 'debit', 'DOC003', MD5('2024-12-15_-15000.00_PAGAMENTO SALARIOS_12345-6'), '550e8400-e29b-41d4-a716-446655440063', '550e8400-e29b-41d4-a716-446655440025', NOW() - INTERVAL '14 days', true, true, NOW() - INTERVAL '15 days'),
('550e8400-e29b-41d4-a716-446655440123', '550e8400-e29b-41d4-a716-446655440110', '550e8400-e29b-41d4-a716-446655440100', '2024-12-20', 'ALUGUEL ESCRITORIO', -3500.00, 'debit', 'DOC004', MD5('2024-12-20_-3500.00_ALUGUEL ESCRITORIO_12345-6'), '550e8400-e29b-41d4-a716-446655440064', '550e8400-e29b-41d4-a716-446655440025', NOW() - INTERVAL '14 days', true, true, NOW() - INTERVAL '15 days'),
('550e8400-e29b-41d4-a716-446655440124', '550e8400-e29b-41d4-a716-446655440110', '550e8400-e29b-41d4-a716-446655440100', '2024-12-25', 'GOOGLE ADS', -1200.00, 'debit', 'DOC005', MD5('2024-12-25_-1200.00_GOOGLE ADS_12345-6'), '550e8400-e29b-41d4-a716-446655440066', '550e8400-e29b-41d4-a716-446655440025', NOW() - INTERVAL '14 days', true, true, NOW() - INTERVAL '15 days'),

-- Tech Solutions - Janeiro 2025
('550e8400-e29b-41d4-a716-446655440125', '550e8400-e29b-41d4-a716-446655440111', '550e8400-e29b-41d4-a716-446655440101', '2025-01-05', 'VENDA SOFTWARE LICENCA', 35000.00, 'credit', 'DOC006', MD5('2025-01-05_35000.00_VENDA SOFTWARE LICENCA_12345-6'), '550e8400-e29b-41d4-a716-446655440060', '550e8400-e29b-41d4-a716-446655440030', NOW() - INTERVAL '4 days', true, true, NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440126', '550e8400-e29b-41d4-a716-446655440111', '550e8400-e29b-41d4-a716-446655440101', '2025-01-08', 'MANUTENCAO MENSAL CLIENTE', 12000.00, 'credit', 'DOC007', MD5('2025-01-08_12000.00_MANUTENCAO MENSAL CLIENTE_12345-6'), '550e8400-e29b-41d4-a716-446655440062', '550e8400-e29b-41d4-a716-446655440030', NOW() - INTERVAL '4 days', true, true, NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440127', '550e8400-e29b-41d4-a716-446655440111', '550e8400-e29b-41d4-a716-446655440101', '2025-01-10', 'RENDIMENTO APLICACAO', 450.00, 'credit', 'DOC008', MD5('2025-01-10_450.00_RENDIMENTO APLICACAO_12345-6'), '550e8400-e29b-41d4-a716-446655440068', '550e8400-e29b-41d4-a716-446655440030', NOW() - INTERVAL '4 days', true, true, NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440128', '550e8400-e29b-41d4-a716-446655440111', '550e8400-e29b-41d4-a716-446655440101', '2025-01-15', 'PAGAMENTO SALARIOS', -16500.00, 'debit', 'DOC009', MD5('2025-01-15_-16500.00_PAGAMENTO SALARIOS_12345-6'), '550e8400-e29b-41d4-a716-446655440063', '550e8400-e29b-41d4-a716-446655440030', NOW() - INTERVAL '4 days', true, true, NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440129', '550e8400-e29b-41d4-a716-446655440111', '550e8400-e29b-41d4-a716-446655440101', '2025-01-20', 'MATERIAL ESCRITORIO', -850.00, 'debit', 'DOC010', MD5('2025-01-20_-850.00_MATERIAL ESCRITORIO_12345-6'), '550e8400-e29b-41d4-a716-446655440065', '550e8400-e29b-41d4-a716-446655440030', NOW() - INTERVAL '4 days', true, true, NOW() - INTERVAL '5 days'),

-- Comercial União - Dezembro 2024
('550e8400-e29b-41d4-a716-446655440130', '550e8400-e29b-41d4-a716-446655440112', '550e8400-e29b-41d4-a716-446655440102', '2024-12-03', 'VENDA MERCADORIAS LOTE 1', 45000.00, 'credit', 'DOC011', MD5('2024-12-03_45000.00_VENDA MERCADORIAS LOTE 1_54321-9'), '550e8400-e29b-41d4-a716-446655440070', '550e8400-e29b-41d4-a716-446655440031', NOW() - INTERVAL '9 days', true, true, NOW() - INTERVAL '10 days'),
('550e8400-e29b-41d4-a716-446655440131', '550e8400-e29b-41d4-a716-446655440112', '550e8400-e29b-41d4-a716-446655440102', '2024-12-08', 'SERVICO ENTREGA EXPRESSA', 2800.00, 'credit', 'DOC012', MD5('2024-12-08_2800.00_SERVICO ENTREGA EXPRESSA_54321-9'), '550e8400-e29b-41d4-a716-446655440071', '550e8400-e29b-41d4-a716-446655440031', NOW() - INTERVAL '9 days', true, true, NOW() - INTERVAL '10 days'),
('550e8400-e29b-41d4-a716-446655440132', '550e8400-e29b-41d4-a716-446655440112', '550e8400-e29b-41d4-a716-446655440102', '2024-12-12', 'CUSTO MERCADORIAS VENDIDAS', -28000.00, 'debit', 'DOC013', MD5('2024-12-12_-28000.00_CUSTO MERCADORIAS VENDIDAS_54321-9'), '550e8400-e29b-41d4-a716-446655440072', '550e8400-e29b-41d4-a716-446655440031', NOW() - INTERVAL '9 days', true, true, NOW() - INTERVAL '10 days'),
('550e8400-e29b-41d4-a716-446655440133', '550e8400-e29b-41d4-a716-446655440112', '550e8400-e29b-41d4-a716-446655440102', '2024-12-18', 'PAGAMENTO FUNCIONARIOS', -12000.00, 'debit', 'DOC014', MD5('2024-12-18_-12000.00_PAGAMENTO FUNCIONARIOS_54321-9'), '550e8400-e29b-41d4-a716-446655440073', '550e8400-e29b-41d4-a716-446655440031', NOW() - INTERVAL '9 days', true, true, NOW() - INTERVAL '10 days'),
('550e8400-e29b-41d4-a716-446655440134', '550e8400-e29b-41d4-a716-446655440112', '550e8400-e29b-41d4-a716-446655440102', '2024-12-22', 'CONTA ENERGIA ELETRICA', -890.00, 'debit', 'DOC015', MD5('2024-12-22_-890.00_CONTA ENERGIA ELETRICA_54321-9'), '550e8400-e29b-41d4-a716-446655440074', '550e8400-e29b-41d4-a716-446655440031', NOW() - INTERVAL '9 days', true, true, NOW() - INTERVAL '10 days'),
('550e8400-e29b-41d4-a716-446655440135', '550e8400-e29b-41d4-a716-446655440112', '550e8400-e29b-41d4-a716-446655440102', '2024-12-28', 'COMBUSTIVEL VEICULOS', -1500.00, 'debit', 'DOC016', MD5('2024-12-28_-1500.00_COMBUSTIVEL VEICULOS_54321-9'), '550e8400-e29b-41d4-a716-446655440075', '550e8400-e29b-41d4-a716-446655440031', NOW() - INTERVAL '9 days', true, true, NOW() - INTERVAL '10 days'),

-- Inova Consultoria - Novembro 2024
('550e8400-e29b-41d4-a716-446655440140', '550e8400-e29b-41d4-a716-446655440113', '550e8400-e29b-41d4-a716-446655440103', '2024-11-05', 'CONSULTORIA ESTRATEGICA CLIENTE A', 15000.00, 'credit', 'DOC017', MD5('2024-11-05_15000.00_CONSULTORIA ESTRATEGICA CLIENTE A_67890-3'), '550e8400-e29b-41d4-a716-446655440080', '550e8400-e29b-41d4-a716-446655440027', NOW() - INTERVAL '19 days', true, true, NOW() - INTERVAL '20 days'),
('550e8400-e29b-41d4-a716-446655440141', '550e8400-e29b-41d4-a716-446655440113', '550e8400-e29b-41d4-a716-446655440103', '2024-11-12', 'TREINAMENTO LIDERANCA', 8500.00, 'credit', 'DOC018', MD5('2024-11-12_8500.00_TREINAMENTO LIDERANCA_67890-3'), '550e8400-e29b-41d4-a716-446655440081', '550e8400-e29b-41d4-a716-446655440027', NOW() - INTERVAL '19 days', true, true, NOW() - INTERVAL '20 days'),
('550e8400-e29b-41d4-a716-446655440142', '550e8400-e29b-41d4-a716-446655440113', '550e8400-e29b-41d4-a716-446655440103', '2024-11-18', 'PAGAMENTO CONSULTOR EXTERNO', -5000.00, 'debit', 'DOC019', MD5('2024-11-18_-5000.00_PAGAMENTO CONSULTOR EXTERNO_67890-3'), '550e8400-e29b-41d4-a716-446655440082', '550e8400-e29b-41d4-a716-446655440027', NOW() - INTERVAL '19 days', true, true, NOW() - INTERVAL '20 days'),
('550e8400-e29b-41d4-a716-446655440143', '550e8400-e29b-41d4-a716-446655440113', '550e8400-e29b-41d4-a716-446655440103', '2024-11-25', 'INTERNET E TELEFONE', -890.00, 'debit', 'DOC020', MD5('2024-11-25_-890.00_INTERNET E TELEFONE_67890-3'), '550e8400-e29b-41d4-a716-446655440083', '550e8400-e29b-41d4-a716-446655440027', NOW() - INTERVAL '19 days', true, true, NOW() - INTERVAL '20 days'),
('550e8400-e29b-41d4-a716-446655440144', '550e8400-e29b-41d4-a716-446655440113', '550e8400-e29b-41d4-a716-446655440103', '2024-11-28', 'GOOGLE ADS NOVEMBRO', -1200.00, 'debit', 'DOC021', MD5('2024-11-28_-1200.00_GOOGLE ADS NOVEMBRO_67890-3'), '550e8400-e29b-41d4-a716-446655440084', '550e8400-e29b-41d4-a716-446655440027', NOW() - INTERVAL '19 days', true, true, NOW() - INTERVAL '20 days'),

-- Distribuidora Logística - Dezembro 2024
('550e8400-e29b-41d4-a716-446655440150', '550e8400-e29b-41d4-a716-446655440114', '550e8400-e29b-41d4-a716-446655440104', '2024-12-03', 'FRETE SAO PAULO-RIO', 12000.00, 'credit', 'DOC022', MD5('2024-12-03_12000.00_FRETE SAO PAULO-RIO_98765-4'), '550e8400-e29b-41d4-a716-446655440086', '550e8400-e29b-41d4-a716-446655440027', NOW() - INTERVAL '11 days', true, true, NOW() - INTERVAL '12 days'),
('550e8400-e29b-41d4-a716-446655440151', '550e8400-e29b-41d4-a716-446655440114', '550e8400-e29b-41d4-a716-446655440104', '2024-12-08', 'ARMAZENAGEM MENSAL', 8500.00, 'credit', 'DOC023', MD5('2024-12-08_8500.00_ARMAZENAGEM MENSAL_98765-4'), '550e8400-e29b-41d4-a716-446655440087', '550e8400-e29b-41d4-a716-446655440027', NOW() - INTERVAL '11 days', true, true, NOW() - INTERVAL '12 days'),
('550e8400-e29b-41d4-a716-446655440152', '550e8400-e29b-41d4-a716-446655440114', '550e8400-e29b-41d4-a716-446655440104', '2024-12-10', 'FRETE BRASILIA-GOIANIA', 5500.00, 'credit', 'DOC024', MD5('2024-12-10_5500.00_FRETE BRASILIA-GOIANIA_98765-4'), '550e8400-e29b-41d4-a716-446655440086', '550e8400-e29b-41d4-a716-446655440027', NOW() - INTERVAL '11 days', true, true, NOW() - INTERVAL '12 days'),
('550e8400-e29b-41d4-a716-446655440153', '550e8400-e29b-41d4-a716-446655440114', '550e8400-e29b-41d4-a716-446655440104', '2024-12-15', 'COMBUSTIVEL DEZEMBRO', -4200.00, 'debit', 'DOC025', MD5('2024-12-15_-4200.00_COMBUSTIVEL DEZEMBRO_98765-4'), '550e8400-e29b-41d4-a716-446655440088', '550e8400-e29b-41d4-a716-446655440027', NOW() - INTERVAL '11 days', true, true, NOW() - INTERVAL '12 days'),
('550e8400-e29b-41d4-a716-446655440154', '550e8400-e29b-41d4-a716-446655440114', '550e8400-e29b-41d4-a716-446655440104', '2024-12-20', 'MANUTENCAO FROTA', -2800.00, 'debit', 'DOC026', MD5('2024-12-20_-2800.00_MANUTENCAO FROTA_98765-4'), '550e8400-e29b-41d4-a716-446655440089', '550e8400-e29b-41d4-a716-446655440027', NOW() - INTERVAL '11 days', true, true, NOW() - INTERVAL '12 days'),
('550e8400-e29b-41d4-a716-446655440155', '550e8400-e29b-41d4-a716-446655440114', '550e8400-e29b-41d4-a716-446655440104', '2024-12-25', 'SEGURO VEICULOS', -1500.00, 'debit', 'DOC027', MD5('2024-12-25_-1500.00_SEGURO VEICULOS_98765-4'), '550e8400-e29b-41d4-a716-446655440090', '550e8400-e29b-41d4-a716-446655440027', NOW() - INTERVAL '11 days', true, true, NOW() - INTERVAL '12 days');

-- ====================================
-- 11. DRES GERADAS
-- ====================================
INSERT INTO dre (id, company_id, period_start, period_end, data, generated_by_user_id, generated_at, version) VALUES
('550e8400-e29b-41d4-a716-446655440160', '550e8400-e29b-41d4-a716-446655440040', '2024-12-01', '2024-12-31',
'{"receita_bruta": 33500.00, "deducoes": 0, "receita_liquida": 33500.00, "despesas_administrativas": 19700.00, "despesas_comerciais": 1200.00, "lucro_operacional": 12600.00, "receitas_financeiras": 0, "despesas_financeiras": 0, "lucro_liquido": 12600.00}',
'550e8400-e29b-41d4-a716-446655440025', NOW() - INTERVAL '14 days', 1),

('550e8400-e29b-41d4-a716-446655440161', '550e8400-e29b-41d4-a716-446655440040', '2025-01-01', '2025-01-31',
'{"receita_bruta": 47450.00, "deducoes": 0, "receita_liquida": 47450.00, "despesas_administrativas": 17350.00, "despesas_comerciais": 0, "receitas_financeiras": 450.00, "lucro_operacional": 30550.00, "lucro_liquido": 30550.00}',
'550e8400-e29b-41d4-a716-446655440030', NOW() - INTERVAL '4 days', 1),

('550e8400-e29b-41d4-a716-446655440162', '550e8400-e29b-41d4-a716-446655440041', '2024-12-01', '2024-12-31',
'{"receita_bruta": 47800.00, "deducoes": 0, "receita_liquida": 47800.00, "custo_mercadorias": 28000.00, "lucro_bruto": 19800.00, "despesas_administrativas": 12890.00, "despesas_comerciais": 1500.00, "lucro_operacional": 5410.00, "lucro_liquido": 5410.00}',
'550e8400-e29b-41d4-a716-446655440031', NOW() - INTERVAL '9 days', 1),

('550e8400-e29b-41d4-a716-446655440163', '550e8400-e29b-41d4-a716-446655440042', '2024-11-01', '2024-11-30',
'{"receita_bruta": 23500.00, "receita_liquida": 23500.00, "despesas_administrativas": 5890.00, "despesas_comerciais": 1200.00, "lucro_operacional": 16410.00, "lucro_liquido": 16410.00}',
'550e8400-e29b-41d4-a716-446655440027', NOW() - INTERVAL '19 days', 1),

('550e8400-e29b-41d4-a716-446655440164', '550e8400-e29b-41d4-a716-446655440043', '2024-12-01', '2024-12-31',
'{"receita_bruta": 26000.00, "receita_liquida": 26000.00, "despesas_operacionais": 8500.00, "lucro_operacional": 17500.00, "lucro_liquido": 17500.00}',
'550e8400-e29b-41d4-a716-446655440027', NOW() - INTERVAL '11 days', 1);

-- ====================================
-- 12. LOGS DE AUDITORIA
-- ====================================
INSERT INTO audit_log (id, user_id, company_id, action, entity, entity_id, details, ip_address, user_agent, created_at) VALUES
-- Criações iniciais
('550e8400-e29b-41d4-a716-446655440170', '550e8400-e29b-41d4-a716-446655440020', NULL, 'CREATE', 'User', '550e8400-e29b-41d4-a716-446655440030', '{"email": "admin@techsolutions.com.br", "role": "admin", "type": "company"}'::jsonb, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW() - INTERVAL '30 days'),
('550e8400-e29b-41d4-a716-446655440171', '550e8400-e29b-41d4-a716-446655440020', NULL, 'CREATE', 'Company', '550e8400-e29b-41d4-a716-446655440040', '{"name": "Tech Solutions Ltda", "cnpj": "12.345.678/0001-90"}'::jsonb, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW() - INTERVAL '30 days'),
('550e8400-e29b-41d4-a716-446655440172', '550e8400-e29b-41d4-a716-446655440021', NULL, 'CREATE', 'User', '550e8400-e29b-41d4-a716-446655440032', '{"email": "admin@inovaconsultoria.com.br", "role": "admin", "type": "company"}'::jsonb, '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', NOW() - INTERVAL '25 days'),
('550e8400-e29b-41d4-a716-446655440173', '550e8400-e29b-41d4-a716-446655440021', NULL, 'CREATE', 'Company', '550e8400-e29b-41d4-a716-446655440042', '{"name": "Inova Consultoria ME", "cnpj": "34.567.890/0001-12"}'::jsonb, '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', NOW() - INTERVAL '25 days'),
('550e8400-e29b-41d4-a716-446655440174', '550e8400-e29b-41d4-a716-446655440021', NULL, 'CREATE', 'Company', '550e8400-e29b-41d4-a716-446655440043', '{"name": "Distribuidora Logística Ltda", "cnpj": "45.678.901/0001-23"}'::jsonb, '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', NOW() - INTERVAL '25 days'),

-- Importações de extratos
('550e8400-e29b-41d4-a716-446655440175', '550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440040', 'IMPORT', 'BankStatement', '550e8400-e29b-41d4-a716-446655440110', '{"fileName": "extrato_dezembro_2024.ofx", "transactionsCount": 5, "bank": "Banco do Brasil"}'::jsonb, '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW() - INTERVAL '15 days'),
('550e8400-e29b-41d4-a716-446655440176', '550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440040', 'IMPORT', 'BankStatement', '550e8400-e29b-41d4-a716-446655440111', '{"fileName": "extrato_janeiro_2025.ofx", "transactionsCount": 5, "bank": "Banco do Brasil"}'::jsonb, '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440177', '550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440041', 'IMPORT', 'BankStatement', '550e8400-e29b-41d4-a716-446655440112', '{"fileName": "extrato_dezembro_2024.ofx", "transactionsCount": 6, "bank": "Itaú Unibanco"}'::jsonb, '192.168.1.103', 'Mozilla/5.0 (X11; Linux x86_64)', NOW() - INTERVAL '10 days'),

-- Geração de DREs
('550e8400-e29b-41d4-a716-446655440178', '550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440040', 'GENERATE', 'DRE', '550e8400-e29b-41d4-a716-446655440160', '{"period": "2024-12", "lucroLiquido": 12600.00, "version": 1}'::jsonb, '192.168.1.104', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW() - INTERVAL '14 days'),
('550e8400-e29b-41d4-a716-446655440179', '550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440040', 'GENERATE', 'DRE', '550e8400-e29b-41d4-a716-446655440161', '{"period": "2025-01", "lucroLiquido": 30550.00, "version": 1}'::jsonb, '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW() - INTERVAL '4 days'),
('550e8400-e29b-41d4-a716-446655440180', '550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440041', 'GENERATE', 'DRE', '550e8400-e29b-41d4-a716-446655440162', '{"period": "2024-12", "lucroLiquido": 5410.00, "version": 1}'::jsonb, '192.168.1.103', 'Mozilla/5.0 (X11; Linux x86_64)', NOW() - INTERVAL '9 days'),

-- Classificações de transações
('550e8400-e29b-41d4-a716-446655440181', '550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440040', 'UPDATE', 'BankTransaction', '550e8400-e29b-41d4-a716-446655440120', '{"action": "classified", "account": "Vendas de Software", "amount": 25000.00}'::jsonb, '192.168.1.104', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW() - INTERVAL '14 days'),
('550e8400-e29b-41d4-a716-446655440182', '550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440040', 'UPDATE', 'BankTransaction', '550e8400-e29b-41d4-a716-446655440121', '{"action": "classified", "account": "Serviços de Consultoria", "amount": 8500.00}'::jsonb, '192.168.1.104', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW() - INTERVAL '14 days'),

-- Gerenciamento de usuários
('550e8400-e29b-41d4-a716-446655440183', '550e8400-e29b-41d4-a716-446655440020', NULL, 'CREATE', 'User', '550e8400-e29b-41d4-a716-446655440025', '{"email": "contador1@silva.com.br", "role": "operator", "type": "accountingFirm"}'::jsonb, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW() - INTERVAL '28 days'),
('550e8400-e29b-41d4-a716-446655440184', '550e8400-e29b-41d4-a716-446655440020', NULL, 'CREATE', 'UserCompanyAccess', '550e8400-e29b-41d4-a716-446655440050', '{"userId": "550e8400-e29b-41d4-a716-446655440025", "companyId": "550e8400-e29b-41d4-a716-446655440040", "permissions": ["read", "write", "import", "export", "dre_generate"]}'::jsonb, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW() - INTERVAL '27 days'),

-- Exportações
('550e8400-e29b-41d4-a716-446655440185', '550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440040', 'EXPORT', 'DRE', '550e8400-e29b-41d4-a716-446655440161', '{"format": "excel", "period": "2025-01", "filename": "DRE_TechSolutions_Jan2025.xlsx"}'::jsonb, '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW() - INTERVAL '3 days'),
('550e8400-e29b-41d4-a716-446655440186', '550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440041', 'EXPORT', 'BankTransaction', 'all', '{"format": "excel", "period": "2024-12", "filename": "Transacoes_ComercialUniao_Dez2024.xlsx"}'::jsonb, '192.168.1.103', 'Mozilla/5.0 (X11; Linux x86_64)', NOW() - INTERVAL '7 days'),

-- Logins recentes
('550e8400-e29b-41d4-a716-446655440187', '550e8400-e29b-41d4-a716-446655440020', NULL, 'LOGIN', 'User', '550e8400-e29b-41d4-a716-446655440020', jsonb_build_object('loginTime', (NOW() - INTERVAL '2 hours')::text, 'method', 'email'), '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW() - INTERVAL '2 hours'),
('550e8400-e29b-41d4-a716-446655440188', '550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440040', 'LOGIN', 'User', '550e8400-e29b-41d4-a716-446655440030', jsonb_build_object('loginTime', (NOW() - INTERVAL '1 hour')::text, 'method', 'email'), '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW() - INTERVAL '1 hour'),
('550e8400-e29b-41d4-a716-446655440189', '550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440040', 'LOGIN', 'User', '550e8400-e29b-41d4-a716-446655440025', jsonb_build_object('loginTime', (NOW() - INTERVAL '30 minutes')::text, 'method', 'email'), '192.168.1.104', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW() - INTERVAL '30 minutes'),

-- Ativações e desativações
('550e8400-e29b-41d4-a716-446655440190', '550e8400-e29b-41d4-a716-446655440021', NULL, 'UPDATE', 'User', '550e8400-e29b-41d4-a716-446655440027', '{"action": "status_change", "from": "inactive", "to": "active", "reason": "reativacao_solicitada"}'::jsonb, '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', NOW() - INTERVAL '8 days'),
('550e8400-e29b-41d4-a716-446655440191', '550e8400-e29b-41d4-a716-446655440022', NULL, 'CREATE', 'Company', '550e8400-e29b-41d4-a716-446655440044', '{"name": "Construtora Planalto Ltda", "cnpj": "56.789.012/0001-34"}'::jsonb, '192.168.1.105', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)', NOW() - INTERVAL '18 days'),

-- Alterações de permissões
('550e8400-e29b-41d4-a716-446655440192', '550e8400-e29b-41d4-a716-446655440020', NULL, 'UPDATE', 'UserCompanyAccess', '550e8400-e29b-41d4-a716-446655440052', '{"action": "permissions_updated", "userId": "550e8400-e29b-41d4-a716-446655440026", "oldPermissions": ["read"], "newPermissions": ["read", "write"]}'::jsonb, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW() - INTERVAL '12 days'),

-- Reconciliações
('550e8400-e29b-41d4-a716-446655440193', '550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440040', 'UPDATE', 'BankTransaction', '550e8400-e29b-41d4-a716-446655440125', '{"action": "reconciled", "description": "VENDA SOFTWARE LICENCA", "amount": 35000.00}'::jsonb, '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW() - INTERVAL '4 days'),
('550e8400-e29b-41d4-a716-446655440194', '550e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440042', 'GENERATE', 'DRE', '550e8400-e29b-41d4-a716-446655440163', '{"period": "2024-11", "lucroLiquido": 16410.00, "version": 1}'::jsonb, '192.168.1.106', 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)', NOW() - INTERVAL '19 days'),
('550e8400-e29b-41d4-a716-446655440195', '550e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440043', 'GENERATE', 'DRE', '550e8400-e29b-41d4-a716-446655440164', '{"period": "2024-12", "lucroLiquido": 17500.00, "version": 1}'::jsonb, '192.168.1.106', 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)', NOW() - INTERVAL '11 days');

-- ====================================
-- RESUMO E COMENTÁRIOS FINAIS
-- ====================================

update users set password = '$2b$10$KQA1Z83fKPpNuU3rX2XVQerhLSTpovfM8Uy9.WlF3GBWXs4SuAjnK'

/*
✅ SEED CONCLUÍDO COM SUCESSO - NOVO SCHEMA SIMPLIFICADO!

📊 RESUMO DOS DADOS CRIADOS:
   • 9 Grupos DRE
   • 5 Firmas Contábeis (3 escritórios + 2 autônomos)
   • 12 Usuários total:
     - 5 admins de firmas (admin + accountingFirm)
     - 3 contadores funcionários (operator + accountingFirm)
     - 5 donos de empresas (admin + company)
     - 3 funcionários de empresas (operator + company)
   • 5 Empresas
   • 5 Acessos via UserCompanyAccess (contadores → empresas)
   • 38 Contas do Plano de Contas
   • 5 Logs de Importação
   • 5 Extratos Bancários
   • 27 Transações Bancárias (todas classificadas)
   • 5 DREs Geradas
   • 25 Logs de Auditoria

🎯 PERFIS DE USUÁRIO IMPLEMENTADOS:

1. **ADMINS DE FIRMAS** (admin + accountingFirm):
   - admin@silva.com.br (Roberto Silva)
   - admin@moderna.com.br (Ana Moderna)
   - admin@jfassessoria.com.br (José Fernando)
   - joao@contador.com.br (João Santos - Autônomo)
   - maria@contadora.com.br (Maria Oliveira - Autônoma)

2. **CONTADORES FUNCIONÁRIOS** (operator + accountingFirm):
   - contador1@silva.com.br (Carlos Souza)
   - contador2@silva.com.br (Fernanda Lima)
   - contador@moderna.com.br (Pedro Costa)

3. **DONOS DE EMPRESAS** (admin + company):
   - admin@techsolutions.com.br (Ricardo Santos)
   - admin@comercialuniao.com.br (Luiza Ferreira)
   - admin@inovaconsultoria.com.br (Marcos Oliveira)
   - admin@distribuidoralogistica.com.br (Carla Silva)
   - admin@construtoraplanalto.com.br (Paulo Mendes)

4. **FUNCIONÁRIOS DE EMPRESAS** (operator + company):
   - financeiro@techsolutions.com.br (Ana Financeiro)
   - operador@comercialuniao.com.br (José Operador)
   - assistente@inovaconsultoria.com.br (Maria Assistente)

🔐 CREDENCIAIS PARA TESTE:
   **Senha para todos**: 123456

🚀 CASOS DE USO COBERTOS:

✅ **Contador autônomo**: João e Maria (próprios donos do negócio)
✅ **Escritório grande**: Silva & Associados (admin + funcionários)
✅ **Empresa sem contador**: Empresas podem operar independente
✅ **Empresa com contador**: Via UserCompanyAccess
✅ **Controle granular**: Permissões específicas por usuário/empresa
✅ **Auditoria completa**: Todos logs de ações importantes

📈 **DADOS FINANCEIROS REALISTAS**:
   - Tech Solutions: R$ 30.550 lucro líquido (Jan/2025)
   - Comercial União: R$ 5.410 lucro líquido (Dez/2024)
   - Inova Consultoria: R$ 16.410 lucro líquido (Nov/2024)
   - Distribuidora Logística: R$ 17.500 lucro líquido (Dez/2024)

🎯 **FUNCIONALIDADES TESTÁVEIS**:
   - Login com diferentes perfis
   - Importação de extratos (histórico)
   - Classificação de transações
   - Geração de DREs
   - Controle de acesso por empresa
   - Auditoria completa de ações
   - Relacionamentos empresa-contador

💡 **BANCO DE DADOS PRONTO PARA DESENVOLVIMENTO!**
*/

-- ====================================
-- QUERIES ÚTEIS PARA VERIFICAÇÃO
-- ====================================

-- Verificar estrutura de usuários por tipo e role
/*
SELECT
    u.name,
    u.email,
    u.role,
    u.type,
    af.name as firma_contabil,
    c.name as empresa
FROM users u
LEFT JOIN accounting_firms af ON u.accounting_firm_id = af.id
LEFT JOIN companies c ON u.company_id = c.id
ORDER BY u.type, u.role, u.name;
*/

-- Verificar acessos por empresa
/*
SELECT
    c.name as empresa,
    u.name as usuario,
    u.role,
    u.type,
    uca.permissions,
    CASE
        WHEN u.id = c.owner_id THEN 'Owner'
        WHEN uca.id IS NOT NULL THEN 'Access Grant'
        WHEN u.company_id = c.id THEN 'Direct Link'
        ELSE 'No Access'
    END as tipo_acesso
FROM companies c
LEFT JOIN user_company_access uca ON c.id = uca.company_id
LEFT JOIN users u ON (uca.user_id = u.id OR c.owner_id = u.id OR u.company_id = c.id)
WHERE u.id IS NOT NULL
ORDER BY c.name, tipo_acesso, u.name;
*/

-- Verificar transações classificadas por empresa
/*
SELECT
    c.name as empresa,
    COUNT(bt.id) as total_transacoes,
    COUNT(CASE WHEN bt.is_classified THEN 1 END) as classificadas,
    COUNT(CASE WHEN bt.is_reconciled THEN 1 END) as reconciliadas,
    SUM(CASE WHEN bt.amount > 0 THEN bt.amount ELSE 0 END) as total_entradas,
    SUM(CASE WHEN bt.amount < 0 THEN bt.amount ELSE 0 END) as total_saidas
FROM companies c
JOIN bank_statements bs ON c.id = bs.company_id
JOIN bank_transactions bt ON bs.id = bt.statement_id
GROUP BY c.id, c.name
ORDER BY c.name;
*/

-- Verificar DREs por empresa e período
/*
SELECT
    c.name as empresa,
    d.period_start,
    d.period_end,
    d.data->>'receita_bruta' as receita_bruta,
    d.data->>'lucro_liquido' as lucro_liquido,
    u.name as gerado_por,
    d.generated_at
FROM dre d
JOIN companies c ON d.company_id = c.id
LEFT JOIN users u ON d.generated_by_user_id = u.id
ORDER BY c.name, d.period_start;
*/

-- Verificar logs de auditoria por empresa
/*
SELECT
    c.name as empresa,
    u.name as usuario,
    al.action,
    al.entity,
    al.created_at,
    al.details
FROM audit_log al
JOIN users u ON al.user_id = u.id
LEFT JOIN companies c ON al.company_id = c.id
ORDER BY al.created_at DESC
LIMIT 20;
*/