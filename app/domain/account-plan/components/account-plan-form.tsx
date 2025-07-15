// app/components/forms/AccountPlanForm.tsx
import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import { X, Save, FolderTree, Tag, AlertTriangle } from "lucide-react";

interface DREGroup {
  id: string;
  name: string;
  order: number;
  type: string;
}

interface Account {
  id: string;
  name: string;
  type: 'receita' | 'despesa';
  dreGroup: DREGroup;
}

interface AccountPlanFormProps {
  companyId: string;
  dreGroups: DREGroup[];
  account?: Account | null;
  onClose: () => void;
}

export default function AccountPlanForm({
  companyId,
  dreGroups,
  account,
  onClose
}: AccountPlanFormProps) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === "submitting";
  const isEditing = !!account;

  const [formData, setFormData] = useState({
    name: account?.name || '',
    type: account?.type || 'receita' as 'receita' | 'despesa',
    dreGroupId: account?.dreGroup.id || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filtrar grupos DRE por tipo
  const filteredDreGroups = dreGroups.filter(group =>
    formData.type === 'receita' ? group.type === 'receita' : group.type === 'despesa'
  );

  // Auto-selecionar primeiro grupo quando mudar o tipo
  useEffect(() => {
    if (filteredDreGroups.length > 0 && !formData.dreGroupId) {
      setFormData(prev => ({
        ...prev,
        dreGroupId: filteredDreGroups[0].id
      }));
    }
  }, [formData.type, filteredDreGroups]);

  // Reset dreGroupId quando mudar tipo e o grupo atual não for compatível
  useEffect(() => {
    const currentGroup = dreGroups.find(g => g.id === formData.dreGroupId);
    if (currentGroup &&
      ((formData.type === 'receita' && currentGroup.type !== 'receita') ||
        (formData.type === 'despesa' && currentGroup.type !== 'despesa'))) {
      setFormData(prev => ({
        ...prev,
        dreGroupId: filteredDreGroups[0]?.id || ''
      }));
    }
  }, [formData.type, formData.dreGroupId, dreGroups, filteredDreGroups]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome da conta é obrigatório';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    }

    if (!formData.type) {
      newErrors.type = 'Tipo da conta é obrigatório';
    }

    if (!formData.dreGroupId) {
      newErrors.dreGroupId = 'Grupo DRE é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const submitData = new FormData();
    submitData.append('intent', isEditing ? 'update' : 'create');
    submitData.append('name', formData.name.trim());
    submitData.append('type', formData.type);
    submitData.append('dreGroupId', formData.dreGroupId);

    if (isEditing && account) {
      submitData.append('accountId', account.id);
    }

    fetcher.submit(submitData, { method: 'post' });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Fechar modal quando a submissão for bem-sucedida
  useEffect(() => {
    if (fetcher.data?.success && !isSubmitting) {
      onClose();
    }
  }, [fetcher.data?.success, isSubmitting, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FolderTree className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Editar Conta' : 'Nova Conta'}
              </h3>
              <p className="text-sm text-gray-500">
                Adicione uma conta ao plano de contas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Alert */}
          {fetcher.data?.error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{fetcher.data.error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Nome da Conta */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Conta *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ex: Vendas de Produtos"
              className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-indigo-500 ${errors.name
                ? 'border-red-300 focus:border-red-500'
                : 'border-gray-300 focus:border-indigo-500'
                }`}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Tipo */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo *
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-indigo-500 ${errors.type
                ? 'border-red-300 focus:border-red-500'
                : 'border-gray-300 focus:border-indigo-500'
                }`}
              disabled={isSubmitting}
            >
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </select>
            {errors.type && (
              <p className="text-sm text-red-600 mt-1">{errors.type}</p>
            )}
          </div>

          {/* Grupo DRE */}
          <div>
            <label htmlFor="dreGroupId" className="block text-sm font-medium text-gray-700 mb-1">
              Grupo DRE *
            </label>
            <select
              id="dreGroupId"
              value={formData.dreGroupId}
              onChange={(e) => handleInputChange('dreGroupId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-indigo-500 ${errors.dreGroupId
                ? 'border-red-300 focus:border-red-500'
                : 'border-gray-300 focus:border-indigo-500'
                }`}
              disabled={isSubmitting}
            >
              <option value="">Selecione um grupo</option>
              {filteredDreGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            {errors.dreGroupId && (
              <p className="text-sm text-red-600 mt-1">{errors.dreGroupId}</p>
            )}
            {filteredDreGroups.length === 0 && (
              <p className="text-sm text-yellow-600 mt-1">
                Nenhum grupo DRE disponível para o tipo selecionado
              </p>
            )}
          </div>

          {/* Informação sobre o tipo selecionado */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <div className="flex items-start gap-3">
              <Tag className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  {formData.type === 'receita' ? 'Conta de Receita' : 'Conta de Despesa'}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {formData.type === 'receita'
                    ? 'Esta conta será usada para registrar entradas de dinheiro e valores positivos.'
                    : 'Esta conta será usada para registrar saídas de dinheiro e custos.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name.trim() || !formData.dreGroupId}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isEditing ? 'Salvando...' : 'Criando...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditing ? 'Salvar Alterações' : 'Criar Conta'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}