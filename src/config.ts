import { RtpCodecCapability } from "mediasoup/lib/RtpParameters";
import os from "os";

export const config = {
    listenIp: "localhost",
    listenPort: 3000,

    sslCertPath: null,
    sslKeyPath: null,
    
    maxRouterPerWorker: 10,
    maxWorkers: Object.keys(os.cpus()).length,
    // https://mediasoup.org/documentation/v3/mediasoup/api/#WorkerSettings
    worker: {
        logLevel: "debug",
        logTags: [
            "info",
            "ice",
            "dtls",
            "rtp",
            "srtp",
            "rtcp",
        ],
        rtcMinPort: 10000,
        rtcMaxPort: 19999,
    },

    // Docs: https://mediasoup.org/documentation/v3/mediasoup/api/#Router
    // Supported: https://github.com/versatica/mediasoup/blob/v3/src/supportedRtpCapabilities.ts
    router: {
        mediaCodecs: [
            {
                kind: "audio",
                MimeType: "audio/opus",
                clockRate: 48000,
                channels: 2
            },
            {
                kind: "video",
                mimeType: "video/VP8",
                clockRate: 90000,
                parameters: {
                    "x-google-start-bitrate": 1080
                },
            },
            {
                kind: "video",
                mimeType: "video/h264",
                clockRate: 90000,
                parameters: {
                    "packetization-mode": 1,
                    "level-asymmetry-allowed": 1,
                    "x-google-start-bitrate": 1080
                },
            },
            {
                kind: "video",
                mimeType: "video/h264",
                clockRate: 90000,
                parameters: {
                    "packetization-mode": 0,
                    "level-asymmetry-allowed": 1,
                    "x-google-start-bitrate": 1080
                },
            },
        ] as RtpCodecCapability[]
    },

    webRtcTranport: {
        listenIps: [
            {
                ip: "127.0.0.1",
                announcedIp: null
            },
        ],
        maxIncomeBitrate: 1500000,
        initalAvailableOutgoingBitrate: 750000,
    }
}