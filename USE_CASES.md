# Elenco de Use Cases – Fechamento Mensal com DDD

## 1. 👥 Gestão de Usuários

- [ ] CreateUser
- [ ] DisableUser
- [ ] ListUsersByAccountingFirm
- [ ] ChangeUserRole

## 2. 🏢 Gestão de Firma Contábil e Empresa

- [ ] CreateAccountingFirm (seed)
- [ ] CreateCompany
- [ ] ListCompaniesByFirm

## 3. 🧾 Importação de Extratos e Transações

- [x] UploadBankStatement
- [x] ParseOFXFile
- [x] PreventDuplicateImportByHash
- [x] StoreTransactionsFromOFX
- [x] Visualizar transacoes
- [x] Vincular a transacao a uma conta da plano da conta

## 4. 💰 Plano de Contas e Vinculação ao DRE

- [x] CreateAccountPlan (seed)
- [ ] ListAccountPlansByCompany
- [ ] EditAccountPlan

## 5. 📈 Geração e Visualização de DRE

- [ ] GenerateDREFromTransactions
- [ ] ListDREs
- [ ] ExportDREToPDF

## 6. 📜 Auditoria

- [x] LogActionToAuditLog
- [ ] ListAuditLogsByEntityOrUser

## 7. 🔒 Autenticação e Permissões

- [ ] LoginUser
- [x] CheckPermissionToManageUsers
- [ ] CheckUserAccessToCompany
