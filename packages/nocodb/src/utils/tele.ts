import os from 'os';
import Emittery from 'emittery';
import { machineIdSync } from 'node-machine-id';
import isDocker from 'is-docker';
import { packageVersion } from '~/utils/packageVersion';
import TeleBatchProcessor from '~/utils/TeleBatchProcessor';
import { isEE } from '~/utils';
import { getRedisURL } from '~/helpers/redisHelpers';

const isDisabled = !!process.env.NC_DISABLE_TELE;
const cache = !!getRedisURL();
const executable = !!process.env.NC_BINARY_BUILD;
const litestream = !!(
  process.env.LITESTREAM_S3_BUCKET &&
  process.env.LITESTREAM_S3_SECRET_ACCESS_KEY &&
  process.env.LITESTREAM_S3_ACCESS_KEY_ID
);

const sendEvt = () => {};

class Tele {
  static emitter;
  static machineId;
  static config: Record<string, any>;
  static client: TeleBatchProcessor;

  static emit(event, data) {
    try {
      this._init();
    } catch (e) {}
  }

  static init(config: Record<string, any>) {
    Tele.config = config;
    Tele._init();
  }

  static page(args: Record<string, any>) {
  }

  static event(args: Record<string, any>) {
  }

  static _init() {
    try {
      if (!Tele.emitter) {
        Tele.emitter = new Emittery();
        Tele.machineId = machineIdSync();

        let package_id = '';
        let xc_version = '';
        xc_version = process.env.NC_SERVER_UUID;
        package_id = packageVersion;

        const teleData: Record<string, any> = {
          package_id,
          os_type: os.type(),
          os_platform: os.platform(),
          os_release: os.release(),
          node_version: process.version,
          docker: isDocker(),
          xc_version: xc_version,
          env: process.env.NODE_ENV || 'production',
          oneClick: !!process.env.NC_ONE_CLICK,
        };
        teleData.machine_id = `${machineIdSync()},,`;
      }
    } catch (e) {}

    try {
      if (!this.client) {
        this.client = new TeleBatchProcessor();
      }
    } catch {}
  }

  static async getInstanceMeta() {
    try {
      return (
        (Tele.config &&
          Tele.config.instance &&
          (await Tele.config.instance())) ||
        {}
      );
    } catch {
      return {};
    }
  }

  static get id() {
    return this.machineId || machineIdSync();
  }

  static async payload() {
    if (
      process.env.NODE_ENV === 'test' ||
      process.env.NODE_ENV === 'development' ||
      isEE
    )
      return null;

    const payload: Record<string, any> = {
      package_id: packageVersion,
      node_version: process.version,
      xc_version: process.env.NC_SERVER_UUID,
      env: process.env.NODE_ENV || 'production',
      oneClick: !!process.env.NC_ONE_CLICK,
      disabled: isDisabled,
    };
    try {
      payload.os_type = os.type();
      payload.os_platform = os.platform();
      payload.os_release = os.release();
      payload.docker = isDocker();
      payload.machine_id = `${this.id},,`;
      payload.payload = {
        ...((await Tele.getInstanceMeta()) || {}),
        count: global.NC_COUNT,
        upTime: Math.round(process.uptime() / 3600),
        cache,
        litestream,
        executable,
      };
    } catch {
      // ignore
    }
    return payload;
  }
}

async function waitForMachineId(teleData) {
  let i = 5;
  while (i-- && !teleData.machine_id) {
    await new Promise((resolve) => setTimeout(() => resolve(null), 500));
  }
}

if (process.env.NC_ONE_CLICK) {
  try {
    Tele.emit('evt', {
      evt_type: 'ONE_CLICK',
    });
  } catch {}
}

export { Tele };
