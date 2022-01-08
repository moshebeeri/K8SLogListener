import { Injectable } from '@nestjs/common'
const k8s = require('@kubernetes/client-node')
import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { LogLine } from 'src/utils/log-line';


@Injectable()
export class FetcherService {
  private logger: Logger = new Logger('FetcherService')
  private kc
  private k8sApi

  constructor() {
    this.kc = new k8s.KubeConfig()
    this.kc.loadFromDefault()
    this.k8sApi = this.kc.makeApiClient(k8s.CoreV1Api)
    this.fetchStreamTest()
  }
  async fetch() {
    //const logs = await this.k8sApi.readNamespacedPodLog('kafka-0', 'default', undefined, undefined, undefined, undefined, 'true', false, 120000, undefined, true);
    const logs = await this.k8sApi.readNamespacedPodLog('kafka-0', 'default', undefined, undefined, undefined, undefined, 'true', false, undefined, undefined, true);
    this.logger.verbose(logs.body)
  }
  async fetchStream(client: Socket, namespace: string, pod: string) {
    while (true)
    {
      //'emitter', 'emitters'
      //'kafka-0', 'default'
      const res = await this.k8sApi.readNamespacedPodLog('kafka-0', 'default', undefined, true, false, undefined, "true", false, undefined, 50, true)
      this.logger.verbose(res.body)
      res.body.split("\r\n").forEach(msg => {
        const ll = new LogLine(
          msg,
          "Debug",
          "cluster",
          Date.now()*1000,
          "153.168.144.131",
          32001,
          pod,
          namespace,
          )
        client.emit('logline', ll.JSONstringify())
      });
    }
  }
  async fetchStreamTest() {
    const k8sApi = this.k8sApi
    setInterval(async function () {
      try {
        const res = await k8sApi.readNamespacedPodLog('emitter', 'emitters', 'emitter', false, false, undefined, "true", false, 1, undefined, false)
        if(res.body)
          res.body.split("\n").forEach(line => {
            console.log(line)
          })
      } catch (e) {
        console.log(e.message)
      }

    }, 1000);//run this thang every 1 second

    // while (true)
    // {
    //   //readNamespacedPodLog(name: string, namespace: string, container?: string, follow?: boolean, insecureSkipTLSVerifyBackend?: boolean, limitBytes?: number, pretty?: string, previous?: boolean, sinceSeconds?: number, tailLines?: number, timestamps?: boolean
    //   //'emitter', 'emitters', 'emitter'
    //   //'kafka-0', 'default', 'kafka'
    //   const res = await this.k8sApi.readNamespacedPodLog('emitter', 'emitters', 'emitter', false, false, undefined, "true", false, 1, undefined, true)
    //   if(res.body)
    //     res.body.split("\n").forEach(line => {
    //       console.log(line)
    //     })
    // }
  }
}