import { assert } from './util'

export default {
  name: 'Promised',
  props: {
    promise: {
      // allow polyfied Promise
      validator: (p) =>
        p && typeof p.then === 'function' && typeof p.catch === 'function',
    },
    promises: Array,
    pendingDelay: {
      type: [Number, String],
      default: 200,
    },
  },

  data: () => ({
    resolved: false,
    data: null,
    error: null,

    isDelayElapsed: false,
  }),

  render(h) {
    if (this.error instanceof Error || (this.error && this.error.length)) {
      return this.$scopedSlots.catch(this.error)
    } else if (this.resolved) {
      const slot = this.$scopedSlots.default || this.$scopedSlots.then

      return slot.call(this, this.data)
    } else if (this.isDelayElapsed) {
      return this.$slots.default
        ? this.$slots.default[0]
        : this.$slots.pending[0]
    }

    // do not render anything
    return h()
  },

  watch: {
    promise: {
      handler(promise) {
        if (!promise) return
        this.resolved = false
        this.error = null
        this.setupDelay()
        promise
          .then((data) => {
            if (this.promise === promise) {
              this.resolved = true
              this.data = data
            }
          })
          .catch((err) => {
            if (this.promise === promise) this.error = err
          })
      },
      immediate: true,
    },

    promises: {
      handler(promises, oldPromises) {
        if (!promises) return
        if (promises !== oldPromises) {
          // reset the map if there's a new array
          this.ongoingPromises = new Map()
          this.resolved = false
          this.error = []
          this.data = []
          this.setupDelay()
        }
        // do not listen for already set up promises
        promises
          .filter((p) => !this.ongoingPromises.has(p))
          .forEach((p) => {
            this.ongoingPromises.set(p, true)
            p.then((data) => {
              if (this.promises === promises) {
                this.resolved = true
                this.data.push(data)
              }
            }).catch((err) => {
              if (this.promises === promises) this.error.push(err)
            })
          })
      },
      immediate: true,
    },
  },

  methods: {
    setupDelay() {
      if (this.pendingDelay > 0) {
        this.isDelayElapsed = false
        if (this.timerId) clearTimeout(this.timerId)
        this.timerId = setTimeout(
          () => (this.isDelayElapsed = true),
          this.pendingDelay
        )
      } else {
        this.isDelayElapsed = true
      }
    },
  },
}
