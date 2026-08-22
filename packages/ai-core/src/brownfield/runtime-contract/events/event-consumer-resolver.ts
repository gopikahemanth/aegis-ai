/**
 * EventConsumerResolver — Aegis V2.3 Project 2 Phase 7.3
 *
 * Aggregates event producers and consumers across EventEmitter, Socket.IO,
 * typed EventBus, and WebSocket subsystems into unified EventContractNodes.
 */

import { EventEmitterResolver } from "./event-emitter-resolver.js";
import { SocketIOContractResolver } from "./socketio-contract-resolver.js";
import { WebSocketContractResolver } from "./websocket-contract-resolver.js";
import type {
  EventContractNode,
  EventProducerNode,
  EventConsumerNode,
} from "./event-contract-model.js";

export class EventConsumerResolver {
  private readonly projectRoot: string;
  private readonly eeResolver: EventEmitterResolver;
  private readonly socketResolver: SocketIOContractResolver;
  private readonly wsResolver: WebSocketContractResolver;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
    this.eeResolver = new EventEmitterResolver(this.projectRoot);
    this.socketResolver = new SocketIOContractResolver(this.projectRoot);
    this.wsResolver = new WebSocketContractResolver(this.projectRoot);
  }

  /**
   * Discovers all event contracts across all transports.
   */
  public discoverAllContracts(): EventContractNode[] {
    const ee = this.eeResolver.discover();
    const socket = this.socketResolver.discover();
    const ws = this.wsResolver.discover();

    const allProducers: EventProducerNode[] = [...ee.producers, ...socket.producers, ...ws.producers];
    const allConsumers: EventConsumerNode[] = [...ee.consumers, ...socket.consumers, ...ws.consumers];

    const contractMap = new Map<string, EventContractNode>();

    for (const p of allProducers) {
      if (!contractMap.has(p.eventName)) {
        contractMap.set(p.eventName, {
          contractId: `event:${p.eventName}`,
          eventName: p.eventName,
          transport: p.transport,
          room: p.room,
          payloadTypeName: p.payloadTypeName,
          producers: [],
          consumers: [],
        });
      }
      contractMap.get(p.eventName)!.producers.push(p);
    }

    for (const c of allConsumers) {
      if (!contractMap.has(c.eventName)) {
        contractMap.set(c.eventName, {
          contractId: `event:${c.eventName}`,
          eventName: c.eventName,
          transport: c.transport,
          room: c.room,
          payloadTypeName: c.payloadTypeName,
          producers: [],
          consumers: [],
        });
      }
      contractMap.get(c.eventName)!.consumers.push(c);
    }

    return [...contractMap.values()];
  }
}
