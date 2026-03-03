
-- Add Antimicrobiano tipo_receita (RDC 471/2021)
INSERT INTO tipos_receita (id, nome, cor, descricao, validade_dias, vias, uso)
OVERRIDING SYSTEM VALUE
VALUES (5, 'Receita Antimicrobiano', 'Branca', 'Receita para antimicrobianos conforme RDC 471/2021. Emitida em 2 vias, 1ª via retida pela farmácia. Validade de 10 dias.', 10, 2, 'Antibióticos, antimicrobianos em geral');

-- Update all antimicrobiano medications (id_categoria=2) to use the new tipo_receita
UPDATE medicamentos SET id_tipo_receita = 5 WHERE id_categoria = 2;
