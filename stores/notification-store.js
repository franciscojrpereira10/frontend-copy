import { defineStore } from 'pinia'

export const useNotificationStore = defineStore('notification', {
    state: () => ({
        notifications: [],
        unreadCount: 0,
        loading: false
    }),

    actions: {
        async fetchNotifications() {
            this.loading = true
            try {
                const config = useRuntimeConfig()
                const token = useCookie('token').value

                if (!token) return

                const data = await $fetch(`${config.public.apiBase}/notifications`, {
                    headers: { Authorization: `Bearer ${token}` },
                    query: { limit: 10 } // Fetch top 10
                })

                this.notifications = data.notifications || []
                this.unreadCount = data.unreadCount || 0
            } catch (error) {
                console.error('Failed to fetch notifications', error)
            } finally {
                this.loading = false
            }
        },

        async markAsRead(id) {
            try {
                const config = useRuntimeConfig()
                const token = useCookie('token').value

                await $fetch(`${config.public.apiBase}/notifications/${id}/read`, {
                    method: 'PATCH',
                    headers: { Authorization: `Bearer ${token}` }
                })

                // Update local state
                const notif = this.notifications.find(n => n.id === id)
                if (notif && !notif.readFlag) {
                    notif.readFlag = true
                    if (this.unreadCount > 0) this.unreadCount--
                }

            } catch (error) {
                console.error('Failed to mark notification as read', error)
            }
        },

        async markAllAsRead() {
            try {
                const config = useRuntimeConfig()
                const token = useCookie('token').value

                await $fetch(`${config.public.apiBase}/notifications/read-all`, {
                    method: 'PATCH',
                    headers: { Authorization: `Bearer ${token}` }
                })

                // Update local state
                this.notifications.forEach(n => n.readFlag = true)
                this.unreadCount = 0

            } catch (error) {
                console.error('Failed to mark all as read', error)
            }
        }
    }
})
