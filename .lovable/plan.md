

# Atualizar prompt para estimativas visuais sem dados obrigatórios

## Mudança

### `supabase/functions/evolution-compare/index.ts`

Ajustar o `systemPrompt` existente para:

1. Na seção **10. Composição Corporal Aparente**, adicionar instrução para sempre estimar faixa de peso aparente e % de gordura corporal visualmente, mesmo sem dados
2. Na seção **Correlação com Peso**, expandir para cobrir 3 cenários:
   - Com peso + altura: calcular IMC e correlacionar
   - Só com peso: correlacionar mudança de peso com mudanças visuais
   - Sem dados: fornecer estimativas visuais (faixa de peso aparente, % gordura estimado) e recomendar que o médico registre peso/altura
3. Adicionar nova seção **Estimativas Visuais** logo após a tabela resumo, com:
   - Faixa de peso aparente (ex: 75-85kg)
   - % gordura corporal estimado (ex: 20-25%)
   - Biótipo predominante
   - Nota clara de que são estimativas visuais, não medições

4. Nas REGRAS, adicionar:
   - "Sempre forneça estimativas visuais de composição corporal, mesmo sem dados do paciente"
   - "Indique claramente quando valores são estimativas visuais vs dados informados"

Nenhuma mudança no frontend, banco de dados ou formato de resposta da API.

