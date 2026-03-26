import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, LoaderCircle, Trash2, Edit, Shapes } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { getCategories, deleteCategory } from '../services/api';
import { Category } from '../types';
import { CategoryModal } from '../components/features/categories/CategoryModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { extractErrorMessage } from '../utils/errors';
import { useUserSettings } from '../hooks/useUserSettings';

interface DeleteConfirmState {
  id: number;
  name: string;
}

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);
  const { settings } = useUserSettings();

  const fetchCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Falha ao buscar categorias:', error);
      toast.error('Não foi possível carregar as categorias.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (category: Category) => {
    setDeleteConfirm({ id: category.id, name: category.name });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    const { id } = deleteConfirm;
    setDeleteConfirm(null);

    const toastId = toast.loading('Excluindo...');
    try {
      await deleteCategory(id);
      toast.success('Categoria excluída!', { id: toastId });
      fetchCategories();
    } catch (error: unknown) {
      const message = extractErrorMessage(error, 'Não foi possível excluir a categoria.');
      toast.error(message, { id: toastId });
    }
  };

  return (
    <>
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Minhas Categorias</h2>
            <p className="text-slate-400">Gerencie suas categorias de receitas e despesas.</p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-all"
          >
            <PlusCircle size={20} />
            Nova Categoria
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center p-10">
            <LoaderCircle className="animate-spin text-green-500" size={40} />
          </div>
        ) : (
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="p-4 font-semibold">Nome</th>
                  <th className="p-4 font-semibold">Tipo</th>
                  <th className="p-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <tr key={cat.id} className="border-b border-slate-700 last:border-b-0 hover:bg-slate-700/30">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color ?? '#6b7280' }}
                          />
                          {cat.name}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                          cat.type === 'Income' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {cat.type === 'Income' ? 'Receita' : 'Despesa'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleOpenEditModal(cat)} className="text-slate-400 hover:text-white p-2" title="Editar">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDeleteRequest(cat)} className="text-slate-400 hover:text-red-400 p-2" title="Excluir">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3}>
                      <EmptyState
                        icon={<Shapes size={40} />}
                        title="Nenhuma categoria ainda"
                        description="Categorias ajudam a organizar suas receitas e despesas. Crie a primeira para começar."
                        action={{ label: 'Criar Categoria', onClick: handleOpenCreateModal }}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveSuccess={fetchCategories}
        categoryToEdit={editingCategory}
        is503020Enabled={settings.is503020Enabled}
      />
      <ConfirmModal
        isOpen={deleteConfirm !== null}
        title="Excluir Categoria"
        message={`Tem certeza que deseja excluir "${deleteConfirm?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
      />
    </>
  );
}
