import axios from 'axios';

export interface BulkPushResult {
    successCount: number;
    errorCount: number;
    missingTokenColaboradorIds?: number[];
}

/**
 * Envía push vía backend (FCM solo server-side; evita CORS del navegador a Google).
 */
export async function sendBulkPushNotifications(
    apiUrl: string,
    title: string,
    body: string,
    selectedIds: number[],
    empresaId?: string,
): Promise<{ successCount: number; errorCount: number }> {
    const payload: {
        colaboradorIds: number[];
        title: string;
        body: string;
        empresaId?: string;
    } = {
        colaboradorIds: selectedIds,
        title,
        body,
    };
    if (empresaId) {
        payload.empresaId = String(empresaId);
    }
    const { data } = await axios.post<BulkPushResult & { success?: boolean }>(
        `${apiUrl}/notifications/send-bulk-by-colaboradores`,
        payload,
    );

    if (data.success === false) {
        throw new Error((data as { error?: string }).error ?? 'Error al enviar notificaciones');
    }

    return {
        successCount: data.successCount ?? 0,
        errorCount: data.errorCount ?? 0,
    };
}
