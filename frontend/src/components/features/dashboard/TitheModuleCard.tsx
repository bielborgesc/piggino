import { Church, LoaderCircle } from 'lucide-react';
import { useTitheModule } from '../../../hooks/useTitheModule';
import { formatBRL } from '../../../utils/formatters';
import { CategoryTithePreview } from '../../../types';
import toast from 'react-hot-toast';

function CategoryTitheRow({ preview }: { preview: CategoryTithePreview }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-slate-300 text-sm">{preview.categoryName}</span>
        {preview.alreadyGenerated && (
          <span className="text-xs text-green-400 font-medium">(gerado)</span>
        )}
      </div>
      <span className="text-amber-400 font-semibold text-sm">
        {formatBRL(preview.titheAmount)}
      </span>
    </div>
  );
}

export function TitheModuleCard() {
  const { status, isLoading, isToggling, isGenerating, toggle, generate } = useTitheModule();

  const handleToggle = async () => {
    if (!status) return;
    try {
      await toggle(!status.isEnabled);
      toast.success(!status.isEnabled ? 'Modulo Dizimo ativado.' : 'Modulo Dizimo desativado.');
    } catch {
      toast.error('Erro ao alterar Modulo Dizimo.');
    }
  };

  const handleGenerate = async () => {
    try {
      await generate();
      toast.success('Transacoes de dizimo criadas com sucesso!');
    } catch {
      toast.error('Nao foi possivel gerar o dizimo. Verifique se ja foi gerado este mes ou se ha receitas titulaveis registradas.');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 flex items-center justify-center min-h-[120px]">
        <LoaderCircle className="animate-spin text-amber-400" size={24} />
      </div>
    );
  }

  if (!status) return null;

  const hasPendingPreviews = status.categoryPreviews.some((p) => !p.alreadyGenerated);
  const hasAnyPreviews = status.categoryPreviews.length > 0;

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Church size={20} className="text-amber-400" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Modulo Dizimo</p>
            <p className="text-slate-400 text-xs mt-0.5">
              10% de cada receita marcada como dizmavel e reservado como dizimo
            </p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={isToggling}
          aria-label="Ativar ou desativar modulo dizimo"
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
            status.isEnabled ? 'bg-amber-500' : 'bg-slate-600'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200 ${
              status.isEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {status.isEnabled && (
        <div className="border-t border-slate-700 pt-4 space-y-3">
          {hasAnyPreviews ? (
            <>
              <div className="space-y-2">
                {status.categoryPreviews.map((preview) => (
                  <CategoryTitheRow key={preview.categoryId} preview={preview} />
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-slate-700 pt-2">
                <span className="text-slate-400 text-sm font-medium">Total</span>
                <span className="text-amber-400 font-bold text-sm">
                  {formatBRL(status.totalTitheAmount)}
                </span>
              </div>

              {hasPendingPreviews ? (
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full py-2 px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                      <LoaderCircle size={14} className="animate-spin" />
                      Gerando...
                    </span>
                  ) : (
                    'Gerar transacoes de dizimo'
                  )}
                </button>
              ) : (
                <p className="text-green-400 text-xs font-medium">
                  Todas as transacoes de dizimo ja foram geradas para este mes.
                </p>
              )}
            </>
          ) : (
            <p className="text-slate-500 text-xs">
              Nenhuma receita dizmavel registrada neste mes. Marque uma categoria de receita como "Incluir no dizimo" para comecar.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
