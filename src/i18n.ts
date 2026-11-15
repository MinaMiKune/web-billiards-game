export type Locale = 'zh-CN' | 'zh-TW' | 'ja'

export const LOCALES: { value: Locale; label: string }[] = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'ja', label: '日本語' },
]

const messages: Record<string, [string, string, string]> = {
  'PHYSICS PLAYGROUND': ['物理实验场', '物理實驗場', '物理シミュレーション'],
  'TABLE STATUS': ['球台状态', '球桌狀態', 'テーブル状態'],
  'Player 1 breaks': ['玩家 1 开球', '玩家 1 開球', 'プレイヤー 1 のブレイク'],
  'PLAYER 1 · BREAK': ['玩家 1 · 开球', '玩家 1 · 開球', 'プレイヤー 1 · ブレイク'],
  'OPPONENT': ['对手', '對手', '対戦相手'],
  'Local 2P': ['本地双人', '本機雙人', 'ローカル 2 人対戦'],
  'AI opponent': ['AI 对手', 'AI 對手', 'AI 対戦相手'],
  'AI LEVEL': ['AI 难度', 'AI 難度', 'AI レベル'],
  'Beginner': ['初学者', '初學者', '初級'],
  'Amateur': ['业余', '業餘', 'アマチュア'],
  'Advanced': ['进阶', '進階', '上級'],
  'Expert': ['专家', '專家', 'エキスパート'],
  'Master': ['大师', '大師', 'マスター'],
  'SHOT POWER': ['击球力度', '擊球力度', 'ショットの強さ'],
  'New rack': ['重新摆球', '重新擺球', 'ラックをリセット'],
  'BALLS LEFT': ['剩余球数', '剩餘球數', '残りのボール'],
  'OPEN TABLE': ['开放球台', '開放球桌', 'オープンテーブル'],
  'VS': ['对战', '對戰', '対'],
  'CUE BALL CONTACT': ['母球击点', '母球擊點', '手球の撞点'],
  'Center': ['中心', '中心', 'センター'],
  'Choose where the cue strikes the white ball': ['选择母球的击球位置', '選擇母球的擊球位置', '手球を撞く位置を選択'],
  'FOLLOW': ['高杆', '高桿', '押し球'],
  'DRAW': ['低杆', '低桿', '引き球'],
  'Drag the marker · Arrow keys also work · Home resets': ['拖动标记 · 也可使用方向键 · Home 重置', '拖曳標記 · 也可使用方向鍵 · Home 重設', 'マーカーをドラッグ · 矢印キーも使用可能 · Home でリセット'],
  'DRAG BACK FROM THE CUE BALL TO AIM · RELEASE TO SHOOT': ['从母球向后拖动瞄准 · 松开击球', '從母球向後拖曳瞄準 · 放開即可擊球', '手球から後ろにドラッグして照準 · 離してショット'],
  'CAMERA': ['视角', '視角', 'カメラ'],
  'One table · four ways to view': ['同一张球台 · 四种观察视角', '同一張球桌 · 四種觀察視角', '同じテーブル · 4 つの視点'],
  '1 · Top': ['1 · 俯视', '1 · 俯視', '1 · トップ'],
  '2 · Angled': ['2 · 斜视', '2 · 斜視', '2 · 斜め'],
  '3 · Side': ['3 · 侧视', '3 · 側視', '3 · サイド'],
  '4 · Free': ['4 · 自由', '4 · 自由', '4 · フリー'],
  'PHASE 4 · PHYSICS-PLANNED AI OPPONENT': ['阶段 4 · 基于物理规划的 AI 对手', '階段 4 · 基於物理規劃的 AI 對手', 'フェーズ 4 · 物理ベースの AI 対戦相手'],
  'ONLINE PLAY IS RESERVED FOR A FUTURE PHASE': ['在线对战将在后续阶段开发', '線上對戰將於後續階段開發', 'オンライン対戦は今後のフェーズで実装予定'],
  'Choose a clear spot away from balls and pockets': ['请选择远离其他球和袋口的空位', '請選擇遠離其他球與袋口的空位', '他のボールやポケットから離れた場所を選択してください'],
  'Balls in motion': ['球正在滚动', '球正在移動', 'ボールが動いています'],
  'AI is reading the table…': ['AI 正在分析球台…', 'AI 正在分析球桌…', 'AI がテーブルを分析中…'],
  'AI could not find a legal cue-ball position': ['AI 无法找到合法的母球位置', 'AI 無法找到合法的母球位置', 'AI は合法な手球位置を見つけられませんでした'],
  'AI could not find a legal target': ['AI 无法找到合法目标球', 'AI 無法找到合法目標球', 'AI は合法な的球を見つけられませんでした'],
  'AI shot was rejected by the physics world': ['物理引擎拒绝了 AI 击球', '物理引擎拒絕了 AI 擊球', '物理エンジンが AI のショットを拒否しました'],
  'AI OPPONENT': ['AI 对手', 'AI 對手', 'AI 対戦相手'],
  'PLAYER 1': ['玩家 1', '玩家 1', 'プレイヤー 1'],
  'PLAYER 2': ['玩家 2', '玩家 2', 'プレイヤー 2'],
  'PLAYER 1 breaks': ['玩家 1 开球', '玩家 1 開球', 'プレイヤー 1 のブレイク'],
  'UNASSIGNED': ['未分配', '未分配', '未割り当て'],
  'SOLIDS': ['全色球', '全色球', 'ソリッド'],
  'STRIPES': ['花色球', '花色球', 'ストライプ'],
  'Break': ['开球', '開球', 'ブレイク'],
  'Open table': ['开放球台', '開放球桌', 'オープンテーブル'],
  'Game over': ['比赛结束', '比賽結束', 'ゲーム終了'],
  'Groups assigned': ['球组已分配', '球組已分配', 'グループ決定'],
  'Follow': ['高杆', '高桿', '押し球'],
  'Draw': ['低杆', '低桿', '引き球'],
  'Right': ['右塞', '右塞', '右ひねり'],
  'Left': ['左塞', '左塞', '左ひねり'],
  'GAME OVER · START A NEW RACK TO PLAY AGAIN': ['比赛结束 · 重新摆球再来一局', '比賽結束 · 重新擺球再玩一局', 'ゲーム終了 · ラックをリセットして再開'],
  'CLICK A CLEAR SPOT ON THE TABLE TO PLACE THE CUE BALL': ['点击球台空位放置母球', '點擊球桌空位放置母球', 'テーブルの空き場所をクリックして手球を置く'],
  'AI OPPONENT IS ANALYZING THE TABLE': ['AI 对手正在分析球台', 'AI 對手正在分析球桌', 'AI 対戦相手がテーブルを分析中'],
}

let locale: Locale | 'en' = 'en'

export function setLocale(next: Locale): void {
  locale = next
  document.documentElement.lang = next
  const index = next === 'zh-CN' ? 0 : next === 'zh-TW' ? 1 : 2
  const reverse = new Map<string, string>()
  for (const [english, values] of Object.entries(messages)) {
    reverse.set(english, english)
    values.forEach((value) => reverse.set(value, english))
  }
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let node: Node | null
  while ((node = walker.nextNode())) {
    const value = node.nodeValue ?? ''
    const trimmed = value.trim()
    const english = reverse.get(trimmed)
    if (!english) continue
    const translated = messages[english]?.[index] ?? english
    node.nodeValue = value.replace(trimmed, translated)
  }
  const select = document.querySelector<HTMLSelectElement>('#language-select')
  if (select) select.value = next
}

export function t(english: string): string {
  if (locale === 'en') return english
  const index = locale === 'zh-CN' ? 0 : locale === 'zh-TW' ? 1 : 2
  return messages[english]?.[index] ?? english
}

export function getLocale(): Locale | 'en' {
  return locale
}
