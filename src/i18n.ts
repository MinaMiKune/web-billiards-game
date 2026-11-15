export type Locale = 'en' | 'zh-CN' | 'zh-TW' | 'ja'

export const LOCALES: { value: Locale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'ja', label: '日本語' },
]

const messages: Record<string, [string, string, string]> = {
  'PHYSICS PLAYGROUND': ['物理实验场', '物理實驗場', '物理シミュレーション'],
  'TABLE STATUS': ['球台状态', '球桌狀態', 'テーブル状態'],
  'SHOT HISTORY': ['击球记录', '擊球紀錄', 'ショット履歴'],
  'No shots recorded yet': ['暂无击球记录', '尚無擊球紀錄', 'ショット履歴はありません'],
  'MATCH COMPLETE': ['本局结束', '本局結束', 'ゲーム終了'],
  'Shot': ['第', '第', 'ショット'],
  'First contact': ['首次碰球', '首次碰球', '最初の接触'],
  'Pocketed': ['落袋', '落袋', 'ポケットイン'],
  'None': ['无', '無', 'なし'],
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
  'CALL SHOT': ['叫球规则', '叫球規則', 'コールショット'],
  '8-BALL ON BREAK': ['开球时 8 号球规则', '開球時 8 號球規則', 'ブレイク時の 8 ボール'],
  'Re-rack': ['重新摆球', '重新擺球', '再ラック'],
  'Breaker wins': ['开球方获胜', '開球方獲勝', 'ブレイク側の勝利'],
  '8-ball on the break': ['开球时 8 号球落袋', '開球時 8 號球落袋', 'ブレイクで 8 ボールがポケットイン'],
  'CALL BALL': ['指定球', '指定球', 'コールするボール'],
  'CALL POCKET': ['指定袋口', '指定袋口', 'コールするポケット'],
  'Select ball': ['选择球', '選擇球', 'ボールを選択'],
  'Select pocket': ['选择袋口', '選擇袋口', 'ポケットを選択'],
  'Select a called ball and pocket': ['请指定目标球和袋口', '請指定目標球與袋口', 'ボールとポケットを指定してください'],
  'Top left': ['左上袋', '左上袋', '左上ポケット'],
  'Top middle': ['上中袋', '上中袋', '上中央ポケット'],
  'Top right': ['右上袋', '右上袋', '右上ポケット'],
  'Bottom left': ['左下袋', '左下袋', '左下ポケット'],
  'Bottom middle': ['下中袋', '下中袋', '下中央ポケット'],
  'Bottom right': ['右下袋', '右下袋', '右下ポケット'],
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
  'Player': ['玩家', '玩家', 'プレイヤー'],
  'breaks': ['开球', '開球', 'ブレイク'],
  'wins': ['获胜', '獲勝', 'の勝利'],
  '8-ball': ['8 号球', '8 號球', '8 ボール'],
  'Foul': ['犯规', '犯規', 'ファウル'],
  'ball in hand': ['自由球', '自由球', 'フリーボール'],
  'Cue ball pocketed': ['母球落袋', '母球落袋', '手球がポケットに入りました'],
  'No object ball contacted': ['未碰到目标球', '未碰到目標球', '的球に当たりませんでした'],
  '8-ball contacted before the group was cleared': ['尚未清空本方球组就碰到了 8 号球', '尚未清空己方球組就碰到了 8 號球', '自分のグループをクリアする前に 8 ボールに接触しました'],
  'Wrong group contacted first': ['首先碰到错误球组', '首先碰到錯誤球組', '最初に相手グループのボールに接触しました'],
  'No ball reached a cushion after contact': ['碰球后没有球碰到库边', '碰球後沒有球碰到庫邊', '接触後にボールがクッションに届きませんでした'],
  '8-ball on the break · re-rack': ['开球时 8 号球落袋 · 重新摆球', '開球時 8 號球落袋 · 重新擺球', 'ブレイクで 8 ボールがポケットイン · 再ラック'],
  'Groups set': ['球组已确定', '球組已確定', 'グループ決定'],
  'continues': ['继续击球', '繼續擊球', '続けてプレー'],
  'to play': ['准备击球', '準備擊球', 'のプレーです'],
  'ball placed': ['已放置母球', '已放置母球', '手球を配置しました'],
  'pot attempt': ['进球尝试', '進球嘗試', 'ポット狙い'],
  'safety attempt': ['防守尝试', '防守嘗試', 'セーフティ狙い'],
  'bank shot': ['借库球', '借庫球', 'バンクショット'],
  'direct shot': ['直线球', '直線球', 'ストレートショット'],
  'kick shot': ['解球', '解球', 'キックショット'],
  'multi-rail shot': ['多库球', '多庫球', 'マルチレールショット'],
  'target': ['目标球', '目標球', 'ターゲット'],
  'BALL IN HAND — CLICK TO PLACE': ['自由球 — 点击放置母球', '自由球 — 點擊放置母球', 'フリーボール — クリックして手球を配置'],
  'WINNER:': ['获胜者：', '獲勝者：', '勝者：'],
  'VS AI': ['对战 AI', '對戰 AI', 'AI 対戦'],
  'LOCAL 2P': ['本地双人', '本機雙人', 'ローカル 2 人対戦'],
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
    const translated = next === 'en' ? english : messages[english]?.[index] ?? english
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

function translateForLocale(english: string, target: Locale): string {
  if (target === 'en') return english
  const index = target === 'zh-CN' ? 0 : target === 'zh-TW' ? 1 : 2
  return messages[english]?.[index] ?? english
}

/** Translate rule-engine and AI status messages that contain runtime values. */
export function translateGameMessage(message: string, target: Locale = locale): string {
  if (target === 'en') return message

  let match = message.match(/^Player (\d+) breaks$/)
  if (match) return `${translateForLocale('Player', target)} ${match[1]} ${translateForLocale('breaks', target)}`

  match = message.match(/^Player (\d+) wins · 8-ball$/)
  if (match) return `${translateForLocale('Player', target)} ${match[1]} ${translateForLocale('wins', target)} · ${translateForLocale('8-ball', target)}`

  match = message.match(/^Player (\d+) wins · 8-ball on the break$/)
  if (match) return `${translateForLocale('Player', target)} ${match[1]} ${translateForLocale('wins', target)} · ${translateForLocale('8-ball on the break', target)}`

  match = message.match(/^Player (\d+) wins · foul on the 8-ball$/)
  if (match) return `${translateForLocale('Player', target)} ${match[1]} ${translateForLocale('wins', target)} · ${translateForLocale('Foul', target)} · ${translateForLocale('8-ball', target)}`

  match = message.match(/^Foul · (.+) · Player (\d+) ball in hand$/)
  if (match) {
    const reasons = match[1].split(' · ').map((reason) => translateForLocale(reason, target))
    return `${translateForLocale('Foul', target)} · ${reasons.join(' · ')} · ${translateForLocale('Player', target)} ${match[2]} ${translateForLocale('ball in hand', target)}`
  }

  match = message.match(/^Groups set · Player (\d+): (solids|stripes)$/)
  if (match) {
    const group = match[2] === 'solids' ? 'SOLIDS' : 'STRIPES'
    return `${translateForLocale('Groups set', target)} · ${translateForLocale('Player', target)} ${match[1]}: ${translateForLocale(group, target)}`
  }

  match = message.match(/^Player (\d+) continues$/)
  if (match) return `${translateForLocale('Player', target)} ${match[1]} ${translateForLocale('continues', target)}`

  match = message.match(/^Player (\d+) to play$/)
  if (match) return `${translateForLocale('Player', target)} ${match[1]} ${translateForLocale('to play', target)}`

  match = message.match(/^Player (\d+) · ball placed$/)
  if (match) return `${translateForLocale('Player', target)} ${match[1]} · ${translateForLocale('ball placed', target)}`

  match = message.match(/^AI · (pot attempt|safety attempt) · (bank shot|direct shot|kick shot|multi-rail shot) · target (\d+)$/)
  if (match) {
    return `AI · ${translateForLocale(match[1], target)} · ${translateForLocale(match[2], target)} · ${translateForLocale('target', target)} ${match[3]}`
  }

  match = message.match(/^AI · (pot attempt|safety attempt) · target (\d+)$/)
  if (match) {
    return `AI · ${translateForLocale(match[1], target)} · ${translateForLocale('target', target)} ${match[2]}`
  }

  return translateForLocale(message, target)
}
