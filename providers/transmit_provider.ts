/*
 * @adonisjs/transmit
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import '../src/types/extended.js'
import { Transmit } from '../src/transmit.js'
import type { ApplicationService } from '@adonisjs/core/types'
import type { TransmitConfig } from '../src/types/main.js'
import type { Transport } from '@rlanz/bus/types/main'

export default class TransmitProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton('transmit', async () => {
      const config = this.app.config.get<TransmitConfig>('transmit', {})

      let transport: Transport | null = null

      if (config.transport) {
        transport = config.transport.driver()
      }

      return new Transmit(config, transport)
    })
  }

  async boot() {
    const router = await this.app.container.make('router')
    const transmit = await this.app.container.make('transmit')

    router.get('__transmit/events', (ctx) => {
      transmit.$createStream(ctx)
    })

    router.post('__transmit/subscribe', (ctx) => {
      const uid = ctx.request.input('uid')
      const channel = ctx.request.input('channel')

      const success = transmit.$subscribeToChannel(uid, channel, ctx)

      if (!success) {
        return ctx.response.badRequest()
      }

      return ctx.response.noContent()
    })

    router.post('__transmit/unsubscribe', (ctx) => {
      const uid = ctx.request.input('uid')
      const channel = ctx.request.input('channel')

      const success = transmit.$unsubscribeFromChannel(uid, channel, ctx)

      if (!success) {
        return ctx.response.badRequest()
      }

      return ctx.response.noContent()
    })
  }

  async shutdown() {
    const transmit = await this.app.container.make('transmit')

    await transmit.shutdown()
  }
}
