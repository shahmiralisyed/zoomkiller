import { Worker, Router, InvalidStateError } from "mediasoup/lib/types";
import { config } from "../config";
const mediasoup = require("mediasoup")

// one worker per cpu core. 1:1
// one router per room. 1:1
// one worker can has many routers. 1:n

const maxRouters = config.maxRouterPerWorker * config.maxWorkers;

/**
 * worker: the worker.
 * routerCnt: number of router inside this worker.
 */
type WorkerObject = { worker: Worker, routerCnt: 0, /* id: number */ }

/**
 * worker: the worker it belongs to.
 * router: the router.
 */
type RouterObject = { workerObject: WorkerObject, router: Router, /* id: number */ }

const workerObjects: Array<WorkerObject> = [];
const getWorkerObjects = (): ReadonlyArray<WorkerObject> => workerObjects
const getWorkers = (): ReadonlyArray<Worker> => workerObjects.map(wObj => wObj.worker)

const routerObjects: Array<RouterObject> = [];
const getRouterObjects = (): ReadonlyArray<RouterObject> => routerObjects
const getRouters = (): ReadonlyArray<Router> => routerObjects.map(rObj => rObj.router)

let lastRouterObject: RouterObject|null = null


const createWorker = async () => {
    const worker: Worker = await mediasoup.createWorker({
        logLevel: config.worker.logLevel,
        logTages: config.worker.logTags,
        rtcMinPort: config.worker.rtcMinPort,
        rtcMaxPort: config.worker.rtcMaxPort
    });

    const workerObject: WorkerObject = { worker: worker, routerCnt: 0 }
    workerObjects.push(workerObject)

    worker.on("close", () => {
        // clear memory
        const idx = workerObjects.indexOf(workerObject, 0)
        delete workerObjects[idx]
    });

    worker.on("newrouter", (router) => {
        workerObject.routerCnt += 1
    });

    worker.on('died', () => {
        console.error(`mediasoup worker died, exiting in 2 seconds... [pid:${worker.pid}]`);
        setTimeout(() => {
            // close
            worker.close()
        }, 2000);
    });
    
    return workerObject
}

const createRouter = async () => {
    // create if 
    const workerObject: WorkerObject = await getCurrentWorkerObject()

    const mediaCodecs = config.router.mediaCodecs;
    const router = await workerObject.worker.createRouter({mediaCodecs})

    const routerObject: RouterObject = { workerObject: workerObject, router: router }
    routerObjects.push(routerObject)

    lastRouterObject = routerObject

    router.on('close', () => {
        // clear memory
        routerObject.workerObject.routerCnt -= 1

        if (routerObject.workerObject.routerCnt <= 0) {
            routerObject.workerObject.worker.close()
        }

        const idx = routerObjects.indexOf(routerObject, 0)
        delete routerObjects[idx]
    })
    
    return router
}

const getCurrentWorkerObject = async () => {
    if (workerObjects.reduce((acc, crt) => acc + crt.routerCnt, 0) >= maxRouters) {
        throw new InvalidStateError("No router slot is available")
    }

    if(lastRouterObject === null) {
        // initial state, create first worker.
        return createWorker()
    } else if (lastRouterObject.workerObject.routerCnt == config.maxRouterPerWorker) {
        // number of worker is reached the maximum, but some still have slots for a new router.
        if (workerObjects.length >= config.maxWorkers) {
            return workerObjects.reduce((acc, crt) => crt.routerCnt == config.maxRouterPerWorker? acc : crt)
        } else {
            // we have space to create a new worker.
            return createWorker()
        }
    } else {
        // has enough slots in current worker.
        return lastRouterObject.workerObject
    }
}

export {createRouter, /* getWorkerObjects, getWorkers, getRouterObjects, getRouters */}