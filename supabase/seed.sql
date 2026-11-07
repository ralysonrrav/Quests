-- ==============================================================================
-- QUESTÕES BRASIL — SEED SCRIPT (CARGA INICIAL DE QUESTÕES E USUÁRIOS)
-- Execute no SQL Editor do seu Dashboard Supabase após as migrations 01, 02 e 03
-- ==============================================================================

-- 1. Inserir Questões Fundamentais
INSERT INTO questions (
  id, code, institution, agency, exam_name, position, year,
  education_level, discipline, topic, subtopic, modality, difficulty,
  statement, correct_option, key_status, explanation_text, explanation_author, legal_basis, status
) VALUES 
(
  'q-ceb-001', 'QB-2024-PF-001', 'Cebraspe', 'Polícia Federal', 'Concurso Público para Agente de Polícia Federal', 'Agente de Polícia Federal', 2024,
  'superior', 'Direito Constitucional', 'Direitos e Garantias Fundamentais', 'Remédios Constitucionais e Inviolabilidade de Domicílio', 'certo_errado', 'medio',
  'A casa é asilo inviolável do indivíduo, ninguém nela podendo penetrar sem consentimento do morador, salvo em caso de flagrante delito ou desastre, ou para prestar socorro, ou, durante o dia ou à noite, por determinação judicial.',
  'E', 'valida',
  'GABARITO: ERRADO. Conforme o art. 5º, XI, da Constituição Federal de 1988: "a casa é asilo inviolável do indivíduo, ninguém nela podendo penetrar sem consentimento do morador, salvo em caso de flagrante delito ou desastre, ou para prestar socorro, ou, durante o dia, por determinação judicial". A determinação judicial SOMENTE autoriza o ingresso durante o dia, e jamais durante a noite, tornando a assertiva incorreta.',
  'Prof. André Barros', 'Art. 5º, inciso XI, da CF/88; RE 603.616/RO (Tema 280 STF)', 'PUBLISHED'
),
(
  'q-fgv-002', 'QB-2024-RFB-002', 'FGV', 'Receita Federal', 'Auditor-Fiscal da Receita Federal do Brasil', 'Auditor-Fiscal da Receita Federal', 2024,
  'superior', 'Direito Administrativo', 'Atos Administrativos', 'Anulação, Revogação e Convalidação', 'multipla_escolha', 'dificil',
  'A autoridade administrativa competente constatou que determinada licença para construir foi concedida com vício de competência sanável, não havendo lesão ao interesse público nem prejuízo a terceiros. Considerando a teoria dos atos administrativos e a Lei nº 9.784/1999, a Administração Pública:',
  'B', 'valida',
  'GABARITO: B. De acordo com o art. 55 da Lei nº 9.784/1999: "Em decisão na qual se evidencie não acarretarem lesão ao interesse público nem prejuízo a terceiros, os atos que apresentarem defeitos sanáveis poderão ser convalidados pela própria Administração". A convalidação tem efeitos retroativos (ex tunc), aproveitando os efeitos pretéritos válidos gerados pelo ato desde a sua origem.',
  'Profa. Camila Siqueira', 'Art. 55 da Lei nº 9.784/1999; Súmula 473 STF', 'PUBLISHED'
),
(
  'q-fcc-003', 'QB-2024-TRF-003', 'FCC', 'TRF 3ª Região', 'Analista Judiciário - Área Judiciária', 'Analista Judiciário', 2024,
  'superior', 'Língua Portuguesa', 'Crase e Regência', 'Uso obrigatório e facultativo do acento indicativo de crase', 'multipla_escolha', 'medio',
  'O sinal indicativo de crase está empregado em conformidade com a norma-padrão da língua portuguesa em:',
  'C', 'valida',
  'GABARITO: C. Análise minuciosa das alternativas: - A) Incorreto: "à decisões" (singular antes de plural sem artigo "as", crase proibida). - B) Incorreto: não ocorre crase antes de pronome indefinido "todas". - C) CORRETO: quem se dedica, dedica-se A + aquele/aquela/aquilo resulta em "àquele", "àquela", "àquilo". - D) Incorreto: não ocorre crase antes de verbo no infinitivo ("redigir"). - E) Incorreto: não se usa crase antes de pronomes de tratamento iniciados por "Sua/Vossa", com exceção de senhora e senhorita.',
  'Prof. Marcelo Vianna', 'Cegalla, Domingos Paschoal. Novíssima Gramática da Língua Portuguesa', 'PUBLISHED'
),
(
  'q-tcu-004', 'QB-2024-TCU-004', 'Cebraspe', 'Tribunal de Contas da União', 'Auditor Federal de Controle Externo', 'Auditor Federal de Controle Externo', 2024,
  'superior', 'Direito Constitucional', 'Organização dos Poderes', 'Tribunal de Contas da União e Fiscalização Contábil', 'certo_errado', 'dificil',
  'Julgue o item a seguir relativo ao controle externo da Administração Pública: O Tribunal de Contas da União possui competência para sustar diretamente a execução de contrato administrativo e de ato impugnado, independentemente de comunicação prévia ao Poder Legislativo.',
  'E', 'valida',
  'GABARITO: ERRADO. Conforme art. 71, § 1º e § 2º da CF/88: o TCU pode sustar diretamente apenas ATOS administrativos. No caso de CONTRATOS administrativos, a competência para sustar é primariamente do CONGRESSO NACIONAL, que solicitará a medida ao Poder Executivo. Somente se o Congresso Nacional ou o Poder Executivo não efetivarem a medida no prazo de 90 dias é que o TCU decidirá a respeito.',
  'Prof. André Barros', 'Art. 71, §§ 1º e 2º da CF/88', 'PUBLISHED'
),
(
  'q-tjsp-005', 'QB-2024-TJSP-005', 'Vunesp', 'Tribunal de Justiça de SP', 'Escrevente Técnico Judiciário', 'Escrevente Técnico Judiciário', 2024,
  'medio', 'Direito Penal', 'Crimes contra a Administração Pública', 'Peculato e Concussão', 'multipla_escolha', 'facil',
  'O funcionário público que exige, para si ou para outrem, direta ou indiretamente, ainda que fora da função ou antes de assumi-la, mas em razão dela, vantagem indevida, comete o crime de:',
  'B', 'valida',
  'GABARITO: B. Trata-se do crime de Concussão (art. 316 do Código Penal), cujo núcleo é o verbo "EXIGIR". Se o verbo fosse "solicitar" ou "receber", configuraria Corrupção Passiva (art. 317). Se fosse apropriar-se de dinheiro ou valor de que tem a posse em razão do cargo, seria Peculato (art. 312).',
  'Prof. Thiago Santos', 'Art. 316 do Código Penal Brasileiro', 'PUBLISHED'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Inserir Alternativas das Questões
INSERT INTO question_options (question_id, option_id, text, is_correct) VALUES
('q-ceb-001', 'C', 'Certo', false),
('q-ceb-001', 'E', 'Errado', true),

('q-fgv-002', 'A', 'deverá obrigatoriamente revogar o ato com efeitos ex nunc, tendo em vista a conveniência e oportunidade.', false),
('q-fgv-002', 'B', 'poderá convalidar o ato, produzindo efeitos retroativos (ex tunc), por se tratar de vício sanável sem prejuízo ao interesse público ou a terceiros.', true),
('q-fgv-002', 'C', 'deverá anular o ato com efeitos ex nunc, preservando apenas os direitos adquiridos de boa-fé.', false),
('q-fgv-002', 'D', 'está impedida de atuar em razão da preclusão consumativa administrativa.', false),
('q-fgv-002', 'E', 'deve submeter o ato previamente ao Tribunal de Contas da União para validação registral.', false),

('q-fcc-003', 'A', 'O magistrado referiu-se à decisões pretéritas tomadas pelo colegiado.', false),
('q-fcc-003', 'B', 'A comissão encaminhou as diretrizes à todas as unidades jurisdicionais.', false),
('q-fcc-003', 'C', 'A servidora dedicou-se àquela tarefa com rigor técnico irretocável.', true),
('q-fcc-003', 'D', 'O procurador começou à redigir o parecer logo após a oitiva das testemunhas.', false),
('q-fcc-003', 'E', 'Fizemos menção à Sua Excelência durante a solenidade de abertura.', false),

('q-tcu-004', 'C', 'Certo', false),
('q-tcu-004', 'E', 'Errado', true),

('q-tjsp-005', 'A', 'Corrupção passiva.', false),
('q-tjsp-005', 'B', 'Concussão.', true),
('q-tjsp-005', 'C', 'Prevaricação.', false),
('q-tjsp-005', 'D', 'Peculato-apropriação.', false),
('q-tjsp-005', 'E', 'Advocacia administrativa.', false)
ON CONFLICT DO NOTHING;
