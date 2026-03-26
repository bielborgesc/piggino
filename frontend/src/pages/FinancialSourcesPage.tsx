import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, LoaderCircle, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { getFinancialSources, deleteFinancialSource } from '../services/api';
import { FinancialSource } from '../types';
import { FinancialSourceModal } from '../components/features/financial-sources/FinancialSourceModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { extractErrorMessage } from '../utils/errors';

interface DeleteConfirmState {
  id: number;
  name: string;
}

const FINANCIAL_SOURCE_TYPE_LABELS: Record<string, string> = {
  Card: 'Cartão de Crédito',
  Account: 'Conta Corrente',
  Cash: 'Dinheiro',
};

function resolveTypeLabel(type: string): string {
  return FINANCIAL_SOURCE_TYPE_LABELS[type] ?? type;
}

export function FinancialSourcesPage() {
  const [sources, setSources] = useState<FinancialSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<FinancialSource | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);

  const fetchSources = useCallback(async () => {
    try {
      const data = await getFinancialSources();
      setSources(data);
    } catch (error) {
      toast.error('Não foi possível carregar as fontes financeiras.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const handleOpenCreateModal = () => {
    setEditingSource(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (source: FinancialSource) => {
    setEditingSource(source);
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (source: FinancialSource) => {
    setDeleteConfirm({ id: source.id, name: source.name });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    const { id } = deleteConfirm;
    setDeleteConfirm(null);

    const toastId = toast.loading('Excluindo...');
    try {
      await deleteFinancialSource(id);
      toast.success('Fonte excluída!', { id: toastId });
      fetchSources();
    } catch (error: unknown) {
      const message = extractErrorMessage(error, 'Não foi possível excluir a fonte.');
      toast.error(message, { id: toastId });
    }
  };

  return (
    <>
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Fontes Financeiras</h2>
            <p className="text-slate-400">Gerencie suas contas, cartões e dinheiro.</p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg"
          >
            <PlusCircle size={20} />
            Nova Fonte
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
                {sources.map((source) => (
                  <tr key={source.id} className="border-b border-slate-700 last:border-b-0 hover:bg-slate-700/30">
                    <td className="p-4">{source.name}</td>
                    <td className="p-4 text-slate-300">{resolveTypeLabel(source.type)}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleOpenEditModal(source)} className="text-slate-400 hover:text-white p-2" title="Editar"><Edit size={18} /></button>
                      <button onClick={() => handleDeleteRequest(source)} className="text-slate-400 hover:text-red-400 p-2" title="Excluir"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <FinancialSourceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveSuccess={fetchSources}
        sourceToEdit={editingSource}
      />
      <ConfirmModal
        isOpen={deleteConfirm !== null}
        title="Excluir Fonte Financeira"
        message={`Tem certeza que deseja excluir "${deleteConfirm?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
      />
    </>
  );
}
