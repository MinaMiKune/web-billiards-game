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

  it('translates winner and rerack messages', () => {
    expect(translateGameMessage('Player 2 wins · 8-ball', 'zh-CN'))
      .toBe('玩家 2 获胜 · 8 号球')
    expect(translateGameMessage('8-ball on the break · re-rack', 'ja'))
      .toBe('ブレイクで 8 ボールがポケットイン · 再ラック')
  })

  it('leaves unknown messages readable instead of dropping them', () => {
    expect(translateGameMessage('A future unregistered status', 'zh-CN'))
      .toBe('A future unregistered status')
  })
})
