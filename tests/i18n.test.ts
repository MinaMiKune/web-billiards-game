import { describe, expect, it } from 'vitest'
import { translateGameMessage } from '../src/i18n'

describe('dynamic game message localization', () => {
  it('translates break messages in all supported locales', () => {
    expect(translateGameMessage('Player 1 breaks', 'en')).toBe('Player 1 breaks')
    expect(translateGameMessage('Player 1 breaks', 'zh-CN')).toBe('玩家 1 开球')
    expect(translateGameMessage('Player 1 breaks', 'zh-TW')).toBe('玩家 1 開球')
    expect(translateGameMessage('Player 1 breaks', 'ja')).toBe('プレイヤー 1 ブレイク')
  })

  it('translates each foul reason while preserving the player number', () => {
    const message = 'Foul · Cue ball pocketed · Wrong group contacted first · Player 2 ball in hand'
    expect(translateGameMessage(message, 'zh-CN'))
      .toBe('犯规 · 母球落袋 · 首先碰到错误球组 · 玩家 2 自由球')
    expect(translateGameMessage(message, 'zh-TW'))
      .toBe('犯規 · 母球落袋 · 首先碰到錯誤球組 · 玩家 2 自由球')
    expect(translateGameMessage(message, 'ja'))
      .toBe('ファウル · 手球がポケットに入りました · 最初に相手グループのボールに接触しました · プレイヤー 2 フリーボール')
  })

  it('translates group assignment and keeps the assigned group', () => {
    expect(translateGameMessage('Groups set · Player 1: solids', 'zh-CN'))
      .toBe('球组已确定 · 玩家 1: 全色球')
    expect(translateGameMessage('Groups set · Player 2: stripes', 'ja'))
      .toBe('グループ決定 · プレイヤー 2: ストライプ')
  })

  it('translates AI shot feedback and preserves the target number', () => {
    expect(translateGameMessage('AI · pot attempt · target 8', 'zh-CN'))
      .toBe('AI · 进球尝试 · 目标球 8')
    expect(translateGameMessage('AI · safety attempt · target 12', 'ja'))
      .toBe('AI · セーフティ狙い · ターゲット 12')
  })

  it('translates AI bank-shot route feedback in all supported locales', () => {
    const message = 'AI · pot attempt · bank shot · target 8'
    expect(translateGameMessage(message, 'en')).toBe(message)
    expect(translateGameMessage(message, 'zh-CN')).toBe('AI · 进球尝试 · 借库球 · 目标球 8')
    expect(translateGameMessage(message, 'zh-TW')).toBe('AI · 進球嘗試 · 借庫球 · 目標球 8')
    expect(translateGameMessage(message, 'ja')).toBe('AI · ポット狙い · バンクショット · ターゲット 8')
  })

  it('translates AI kick-shot route feedback in all supported locales', () => {
    const message = 'AI · safety attempt · kick shot · target 3'
    expect(translateGameMessage(message, 'zh-CN')).toBe('AI · 防守尝试 · 解球 · 目标球 3')
    expect(translateGameMessage(message, 'zh-TW')).toBe('AI · 防守嘗試 · 解球 · 目標球 3')
    expect(translateGameMessage(message, 'ja')).toBe('AI · セーフティ狙い · キックショット · ターゲット 3')
  })

  it('translates AI multi-rail route feedback in all supported locales', () => {
    const message = 'AI · pot attempt · multi-rail shot · target 11'
    expect(translateGameMessage(message, 'zh-CN')).toBe('AI · 进球尝试 · 多库球 · 目标球 11')
    expect(translateGameMessage(message, 'zh-TW')).toBe('AI · 進球嘗試 · 多庫球 · 目標球 11')
    expect(translateGameMessage(message, 'ja')).toBe('AI · ポット狙い · マルチレールショット · ターゲット 11')
  })

  it('translates behind-head-string ball-in-hand guidance', () => {
    expect(translateGameMessage('BALL IN HAND — BEHIND HEAD STRING', 'zh-CN'))
      .toBe('自由球 — 母球必须放在开球线后方')
    expect(translateGameMessage('Cue ball must stay behind the head string', 'ja'))
      .toBe('手球はヘッドストリングの後方に置いてください')
  })

  it('translates break-requirement settings and foul feedback', () => {
    expect(translateGameMessage('BREAK REQUIREMENT', 'zh-CN')).toBe('开球要求')
    expect(translateGameMessage('Relaxed', 'ja')).toBe('緩和')
    expect(translateGameMessage('4 object balls to rails', 'zh-TW'))
      .toBe('至少 4 顆目標球碰庫')
    expect(translateGameMessage(
      'Illegal break — fewer than four object balls reached a cushion',
      'zh-CN',
    )).toBe('开球犯规：不足 4 颗目标球碰库')
  })

  it('translates 8-ball-on-break rule settings and winner feedback', () => {
    expect(translateGameMessage('8-BALL ON BREAK', 'zh-CN')).toBe('开球时 8 号球规则')
    expect(translateGameMessage('Re-rack', 'ja')).toBe('再ラック')
    expect(translateGameMessage('Breaker wins', 'zh-TW')).toBe('開球方獲勝')
    expect(translateGameMessage('Player 1 wins · 8-ball on the break', 'zh-CN'))
      .toBe('玩家 1 获胜 · 开球时 8 号球落袋')
  })

  it('translates call-shot controls and validation feedback', () => {
    expect(translateGameMessage('CALL SHOT', 'zh-CN')).toBe('叫球规则')
    expect(translateGameMessage('CALL BALL', 'zh-TW')).toBe('指定球')
    expect(translateGameMessage('CALL POCKET', 'ja')).toBe('コールするポケット')
    expect(translateGameMessage('Select a called ball and pocket', 'zh-CN'))
      .toBe('请指定目标球和袋口')
    expect(translateGameMessage('Top middle', 'ja')).toBe('上中央ポケット')
  })

  it('translates match history labels in all supported locales', () => {
    expect(translateGameMessage('SHOT HISTORY', 'zh-CN')).toBe('击球记录')
    expect(translateGameMessage('No shots recorded yet', 'zh-CN')).toBe('暂无击球记录')
    expect(translateGameMessage('MATCH COMPLETE', 'zh-CN')).toBe('本局结束')
    expect(translateGameMessage('First contact', 'zh-CN')).toBe('首次碰球')
    expect(translateGameMessage('Pocketed', 'zh-CN')).toBe('落袋')
    expect(translateGameMessage('None', 'zh-CN')).toBe('无')
  })

  it('translates winner and rerack messages', () => {
    expect(translateGameMessage('Player 2 wins · 8-ball', 'zh-CN'))
      .toBe('玩家 2 获胜 · 8 号球')
    expect(translateGameMessage('8-ball on the break · re-rack', 'ja'))
      .toBe('ブレイクで 8 ボールがポケットイン · 再ラック')
  })


  it('translates rematch and latest-shot outcome labels in all supported locales', () => {
    expect(translateGameMessage('Play again', 'en')).toBe('Play again')
    expect(translateGameMessage('Play again', 'zh-CN')).toBe('再来一局')
    expect(translateGameMessage('Play again', 'zh-TW')).toBe('再玩一局')
    expect(translateGameMessage('Play again', 'ja')).toBe('もう一度プレイ')

    expect(translateGameMessage('Pocketed', 'zh-CN')).toBe('落袋')
    expect(translateGameMessage('Pocketed', 'zh-TW')).toBe('落袋')
    expect(translateGameMessage('Pocketed', 'ja')).toBe('ポケットイン')
    expect(translateGameMessage('No balls pocketed', 'zh-CN')).toBe('没有球落袋')
    expect(translateGameMessage('No balls pocketed', 'zh-TW')).toBe('沒有球落袋')
    expect(translateGameMessage('No balls pocketed', 'ja')).toBe('ボールはポケットに入りませんでした')
  })

  it('leaves unknown messages readable instead of dropping them', () => {
    expect(translateGameMessage('A future unregistered status', 'zh-CN'))
      .toBe('A future unregistered status')
  })
})
