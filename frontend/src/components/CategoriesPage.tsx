import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, LoaderCircle, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCategories, deleteCategory } from '../services/api';
import { Category } from '../types';
import { CategoryModal } from './CategoryModal'; // ✅ Importa o Modal

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // ✅ Estados para controlar o modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      // Não precisa do setIsLoading aqui, pois o onSaveSuccess pode chamar sem mostrar o spinner da página
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Falha ao buscar categorias:", error);
      toast.error("Não foi possível carregar as categorias.");
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

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria? As transações associadas também podem ser afetadas.')) {
      const toastId = toast.loading('Excluindo...');
      try {
        await deleteCategory(id);
        toast.success('Categoria excluída!', { id: toastId });
        fetchCategories(); // Atualiza a lista
      } catch (error) {
        console.error('Falha ao excluir categoria:', error);
        toast.error('Não foi possível excluir a categoria.', { id: toastId });
      }
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
            onClick={handleOpenCreateModal} // ✅ Ação para abrir o modal de criação
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
                      <td className="p-4">{cat.name}</td>
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
                        <button onClick={() => handleDelete(cat.id)} className="text-slate-400 hover:text-red-400 p-2" title="Excluir">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center p-8 text-slate-400">
                      Nenhuma categoria encontrada. Clique em "Nova Categoria" para começar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* ✅ Renderiza o Modal */}
      <CategoryModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveSuccess={fetchCategories}
        categoryToEdit={editingCategory}
      />
    </>
  );
}