# ふるさと納税ページの入力をブラウザに保存する (#51)

- 入力を1つのオブジェクト（`src/furusato/furusatoForm.ts` の `FurusatoForm`）にまとめ、変わるたびに JSON で localStorage（`tax-simulator:furusato`）に保存
- 読み込みは項目ごとに検証し、壊れた・古い形式の項目だけ初期値に戻す（他の項目は残す）
- 「入力をリセット」: 保存を消して初期値に戻す
- 保存の読み書きは本体と同じ `src/utils/storage.ts`（使えない環境でも動く）
