# Templates da revista

Cada template é uma pasta em `templates/revista/<id>/`. O app descobre as pastas sozinho
(`import.meta.glob` em `src/features/magazine/templates.ts`): criar uma pasta nova faz o
template aparecer na tela **Exportar revista**, sem mexer no resto do código.

```
templates/revista/
├── _shared/            contrato e utilitários (não é um template)
│   ├── types.ts        MagazineData (dados que todo template recebe) e MagazineTemplate
│   └── fitText.ts      ajuste de texto em caixas (fonte menor até 8 pt; o resto continua)
└── dois-amores/        template padrão
    ├── tokens.json     nome, descrição e todos os valores visuais do template
    └── template.tsx    as páginas, com @react-pdf/renderer
```

## Criar um template novo

1. **Copie** a pasta `dois-amores` para `templates/revista/<novo-id>/` (o id vira o nome da pasta,
   em minúsculas e com hífens).
2. **Edite o `tokens.json`**:
   - `meta.name` e `meta.description` aparecem no seletor da tela de exportação (obrigatórios);
   - cores, fontes, tamanhos e grades ficam todos aqui — o `template.tsx` não pode ter cor, fonte
     ou tamanho escritos direto (o teste `src/theme/noHardcodedStyles.test.ts` verifica).
3. **Edite o `template.tsx`**. Ele precisa exportar por padrão um `MagazineTemplate`:

   ```tsx
   const template: MagazineTemplate = {
     fonts: [{ family: 'Bebas Neue', src: '/fonts/BebasNeue-Regular.ttf' }, …],
     Document: ({ data }) => <Document>…páginas…</Document>,
   }
   export default template
   ```

   - `fonts`: arquivos TTF/OTF em `public/fonts/` (o @react-pdf não carrega Google Fonts por CSS).
     Para usar uma fonte nova, coloque o arquivo em `public/fonts/` e registre aqui.
   - `Document`: recebe `data: MagazineData` (ver `_shared/types.ts`): clube, período, membros,
     Book Track, edições com uma revisão por membro e as prateleiras "fora do clube".
     As imagens já chegam embutidas (data: URL) ou `null` — sempre trate o `null` com um placeholder.
4. **Rode os testes** (`npm test`). Vale copiar `dois-amores/template.test.tsx` para a pasta nova:
   ele gera o PDF com os dados de exemplo (Leyna, Irla, Wanessa e Thaís, maio a outubro de 2026)
   e confere o número de páginas.
5. Pronto: o template aparece em **Clubes → (clube) → Exportar revista**.

## Regras que todo template deve seguir

- Página horizontal 16:9.
- A **média geral do livro** já vem calculada em `edition.average` (média das médias dos membros,
  `bookAverage` em `src/lib/domain/ratings.ts`); não recalcule de outro jeito.
- **Textos longos**: use `fitText` para reduzir a fonte até 8 pt; o que sobrar vai para uma página
  de continuação (veja `ReviewPages` em `dois-amores/template.tsx`). Calcule o ajuste **antes** de
  montar as colunas, para saber se a página extra será necessária.
- **Campos vazios** mostram um estado vazio elegante ("sem comentários", "—"), nunca
  "Lorem ipsum" ou "00/00".
- **Capas faltantes** mostram um placeholder neutro na cor papel.
- Decorações (adesivos, fitas) são opcionais e ficam em `assets/decor/`.
