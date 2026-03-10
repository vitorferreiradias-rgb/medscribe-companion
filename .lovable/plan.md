

## Plano: Botões de ação dinâmicos no EvolutionPhotoSelector

### Lógica de detecção (3 modos exclusivos)

Com base nas fotos selecionadas, detectar qual ação está disponível:

1. **Avaliação Única** — Exatamente 3 fotos do mesmo `sessao_id` com ângulos `frente`, `perfil`, `costas` → Botão "Gerar Relatório de Composição"
2. **Comparação Simples** — Exatamente 2 fotos de datas diferentes (qualquer ângulo) → Botão "Comparar Fotos Selecionadas"  
3. **Evolução Completa** — Exatamente 2 sessões completas selecionadas (cada uma com `frente`, `perfil`, `costas`) = 6 fotos → Botão "Relatório de Evolução Completa"
4. **Nenhum** — qualquer outra combinação → nenhum botão de ação habilitado, exibir dica textual

### Badge de ângulo nas fotos

Adicionar um badge pequeno no canto superior esquerdo de cada foto com o ângulo (`F`, `P`, `C` ou `?`) usando cores distintas para facilitar identificação visual rápida.

### Alterações no `EvolutionPhotoSelector.tsx`

- Expandir a interface `onSubmit` para `onSubmit(paths: string[], action: 'composition' | 'compare' | 'evolution')`
- Adicionar função `detectAction()` que analisa as fotos selecionadas e retorna o modo ativo
- Renderizar condicionalmente o botão correto com ícone e label apropriados
- Remover `minPhotos` prop (a lógica de habilitação agora é baseada nos modos)
- Adicionar badge de ângulo (canto superior esquerdo) em cada thumbnail

### Alterações no `PacienteDetalhe.tsx`

- Atualizar `handleConsolidatedAnalysis` para aceitar o parâmetro `action` e despachar para a edge function correta (composição, comparação ou evolução)
- Atualizar a chamada do `EvolutionPhotoSelector` com o novo callback

### Arquivos editados
- `src/components/EvolutionPhotoSelector.tsx`
- `src/pages/PacienteDetalhe.tsx`

