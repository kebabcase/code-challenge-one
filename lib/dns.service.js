'use strict';

const Promise = require('bluebird');
const dns = require('dns');
const smtp = require('smtp-protocol');
const SMTPConnection = require('smtp-connection');
const ping = require('ping');
const _ = require('lodash');

class MagnisesDNS {
  /**
   * MagnisesDNS is a wrapper module for DNS.
   *
   * @param {number} [timeout=20000] set default timeout for DNS instance.
   * @param {Object} [options={}] an object containing SMTP options.
   *                  default options:
   *                    {
   *                      smtp: {
   *                        host: 'localhost',
   *                        port: 9025
   *                      }
   *                    }
   */
  constructor(timeout = 20000, options = {}) {
    this.timeout = timeout;

    this.options = _.extend({
      smtp: {
        host: 'localhost',
        port: 9025
      }
    }, options);
  }

  /**
   * Pings a server and returns a promise containing a number value of ms response time
   *
   * @param {string} subject host (e.g. 'google.com' or '127.0.0.1')
   * @returns {promise} number of ms passed since the first request
   *          (e.g. 251)
   */
  ping(host) {
    return new Promise((resolve, reject) => {
      if (!host) {
        reject(new Error('No hostname provided'));
      }

      let resolved = false;
      let ms = 0;

      const timer = setInterval(() => {
        if (!resolved) {
          ms++;
        } else {
          clearInterval(timer);
        }
      }, 1);

      setTimeout(() => {
        ping.sys.probe(host, alive => {
          resolved = true;

          if (alive) {
            resolve(ms);
          }

          reject(new Error('Host Unreachable'));
        });
      });

      setTimeout(() => {
        resolved = true;
        reject(new Error('Timeout Limit Reached'));
      }, this.timeout);
    });
  }

  /**
   * Resolves a hostname (e.g. 'google.com') into the first found A (IPv4) or AAAA (IPv6) record.
   *
   * @param {string} subject hostname (e.g. 'google.com')
   * @param {number || object} options can be an object or integer. If options is not provided,
   *        then IP v4 and v6 addresses are both valid.
   * @returns {promise} address and family are part of the resolved object.
   *          (e.g. {address: '192.0.0.1', family: 4})
   */
  lookup(hostname, options) {
    return new Promise((resolve, reject) => {
      if (!hostname) {
        reject(new Error('No hostname provided'));
      }

      dns.lookup(hostname, options, (err, address, family) => {
        if (err) {
          reject(err);
        }

        resolve({ address, family });
      });

      setTimeout(() => {
        reject(new Error('Timeout Limit Reached'));
      }, this.timeout);
    });
  }

  /**
   * Resolves the given address and port into a hostname and service using getnameinfo
   *
   * @param {string} subject ip address (e.g. '127.0.0.1')
   * @param {number} [port=80] the port number of the above ip address
   * @returns {promise} hostname and service arguments are part of the resolved object.
   *          (e.g. {hostname: 'localhost', service: 'http'})
   */
  lookupService(address, port = 80) {
    return new Promise((resolve, reject) => {
      dns.lookupService(address, port, (err, hostname, service) => {
        if (err) {
          reject(err);
        }

        resolve({ hostname, service });
      });

      setTimeout(() => reject(new Error('Timeout Limit Reached')), this.timeout);
    });
  }

  /**
   * Uses the DNS protocol to resolve a hostname (e.g. 'nodejs.org')
   * into an array of the record types specified by rrtype.
   *
   * @param {string} hostname of the given server (e.g. 'nodejs.org')
   * @param {string} record types (e.g. 'A' for IPV4 addresses, default)
   * @returns {Promise<array>} an array of resolved addresses for given hostname.
   */
  resolve(hostname, rrtype) {
    return new Promise((resolve, reject) => {
      let cb = (err, addresses) => {
        if (err) {
          reject(err);
        }

        resolve(addresses);
      };

      if (!rrtype) {
        rrtype = cb;
        cb = null;
      }

      dns.resolve(hostname, rrtype, cb);

      setTimeout(() => reject(new Error('Timeout Limit Reached')), this.timeout);
    });
  }

  /**
   * Resolves the given hostname into an ipv4 address
   *
   * @param {string} hostname of the given server (e.g. 'google.com')
   * @returns {Promise<array>} an array of assoicated ipv4 addresses
   */
  resolve4(hostname) {
    return new Promise((resolve, reject) => {
      dns.resolve4(hostname, (err, addresses) => {
        if (err) {
          reject(err);
        }

        resolve(addresses);
      });

      setTimeout(() => reject(new Error('Timeout Limit Reached')), this.timeout);
    });
  }

  /**
   * Resolves the given hostname into an ipv6 address
   *
   * @param {string} hostname of the given server (e.g. 'google.com')
   * @returns {Promise<array>} an array of assoicated ipv6 addresses
   */
  resolve6(hostname) {
    return new Promise((resolve, reject) => {
      dns.resolve6(hostname, (err, addresses) => {
        if (err) {
          reject(err);
        }

        resolve(addresses);
      });

      setTimeout(() => reject(new Error('Timeout Limit Reached')), this.timeout);
    });
  }

  /**
   * Uses the DNS protocol to resolve CNAME records for the hostname.
   *
   * @param {string} hostname of the given server (e.g. 'google.com')
   * @returns {Promise<array>} an array of canonical name records available
   *          for the hostname (e.g. ['bar.example.com']).
   */
  resolveCname(hostname) {
    return new Promise((resolve, reject) => {
      dns.resolveCname(hostname, (err, addresses) => {
        if (err) {
          reject(err);
        }

        resolve(addresses);
      });

      setTimeout(() => reject(new Error('Timeout Limit Reached')), this.timeout);
    });
  }

  /**
   * Uses the DNS protocol to resolve mail exchange records (MX records) for the hostname.
   *
   * @param {string} hostname of the given server (e.g. 'google.com')
   * @returns {Promise<array>} an array of objects containing both a priority and exchange
   *          property (e.g. [{priority: 10, exchange: 'mx.example.com'}, ...]).
   */
  resolveMx(hostname) {
    return new Promise((resolve, reject) => {
      dns.resolveMx(hostname, (err, addresses) => {
        if (err) {
          reject(err);
        }

        resolve(addresses);
      });

      setTimeout(() => reject(new Error('Timeout Limit Reached')), this.timeout);
    });
  }

  /**
   * Uses the DNS protocol to resolve name server records (NS records) for the hostname.
   *
   * @param {string} hostname of the given server (e.g. 'google.com')
   * @returns {Promise<array>} an array of name server records available for hostname.
   *          (e.g., ['ns1.example.com', 'ns2.example.com']).
   */
  resolveNs(hostname) {
    return new Promise((resolve, reject) => {
      dns.resolveNs(hostname, (err, addresses) => {
        if (err) {
          reject(err);
        }

        resolve(addresses);
      });

      setTimeout(() => reject(new Error('Timeout Limit Reached')), this.timeout);
    });
  }

  /**
   * Uses the DNS protocol to resolve a start of authority record (SOA record) for the hostname.
   *
   * @param {string} hostname of the given server (e.g. 'google.com')
   * @returns {Promise<object>} an object
   *          (e.g.
   *             {
   *               nsname: 'ns.example.com',
   *               hostmaster: 'root.example.com',
   *               serial: 2013101809,
   *               refresh: 10000,
   *               retry: 2400,
   *               expire: 604800,
   *               minttl: 3600
   *             }
   *          )
   */
  resolveSoa(hostname) {
    return new Promise((resolve, reject) => {
      dns.resolveSoa(hostname, (err, addresses) => {
        if (err) {
          reject(err);
        }

        resolve(addresses);
      });

      setTimeout(() => reject(new Error('Timeout Limit Reached')), this.timeout);
    });
  }

  /**
   * Uses the DNS protocol to resolve service records (SRV records) for the hostname.
   *
   * @param {string} hostname of the given server (e.g. 'google.com')
   * @returns {Promise<object>} an object
   *          (e.g.
   *             {
   *               priority: 10,
   *               weight: 5,
   *               port: 21223,
   *               name: 'service.example.com'
   *             }
   *          )
   */
  resolveSrv(hostname) {
    return new Promise((resolve, reject) => {
      dns.resolveSrv(hostname, (err, addresses) => {
        if (err) {
          reject(err);
        }

        resolve(addresses);
      });

      setTimeout(() => reject(new Error('Timeout Limit Reached')), this.timeout);
    });
  }

  /**
   * Uses the DNS protocol to resolve text queries (TXT records) for the hostname.
   *
   * @param {string} hostname of the given server (e.g. 'google.com')
   * @returns {Promise<array>} a two-dimentional array of the text records available
   *          for hostname (e.g., [ ['v=spf1 ip4:0.0.0.0 ', '~all' ] ]).
   */
  resolveTxt(hostname) {
    return new Promise((resolve, reject) => {
      dns.resolveTxt(hostname, (err, addresses) => {
        if (err) {
          reject(err);
        }

        resolve(addresses);
      });

      setTimeout(() => reject(new Error('Timeout Limit Reached')), this.timeout);
    });
  }

  /**
   * Performs a reverse DNS query that resolves an IPv4 or IPv6 address to an array of hostnames.
   *
   * @param {string} subject ip address (e.g. '127.0.0.1')
   * @returns {Promise<array>} an array of resolved hostnames for the given ip.
   */
  reverse(ip) {
    return new Promise((resolve, reject) => {
      dns.reverse(ip, (err, hostnames) => {
        if (err) {
          reject(err);
        }

        resolve(hostnames);
      });

      setTimeout(() => reject(new Error('Timeout Limit Reached')), this.timeout);
    });
  }

  /**
   * Sets the IP addresses of the servers to be used when resolving.
   *
   * @param {array} an array of IPv4 or IPv6 addresses.
   * @returns {Promise<boolean>} true after dns.setServers() is invoked.
   */
  setServers(servers) {
    return new Promise((resolve, reject) => {
      dns.setServers(servers);

      resolve(true);

      setTimeout(() => reject(new Error('Timeout Limit Reached')), this.timeout);
    });
  }

  /**
   * @returns an array of IP address strings that are being used for name resolution.
   */
  getServers() {
    return new Promise((resolve, reject) => {
      resolve(dns.getServers());

      setTimeout(() => reject(new Error('Timeout Limit Reached')), this.timeout);
    });
  }

  /**
   * Greet the server with the hostname string.
   *
   * @param {string} hostname of the given server (e.g. 'google.com')
   * @returns {Promise<object>} code and lines as a resolved object.
   * 	        (e.g. {code: 250, lines: ['google.com']})
   */
  helo(remoteHost) {
    return new Promise((resolve, reject) => {
      const server = this._createSMTPServer();
      let connection;

      server.then(con => {
        connection = con;

        smtp.connect(this.options.smtp.host, this.options.smtp.port, client => {
          if (!client) {
            reject(new Error('Unable to create smtp client'));
          }

          client.helo(remoteHost, (err, code, lines) => {
            if (err) {
              resolve(false);
            }

            client.quit();

            if (connection) {
              connection.quit();
            }

            resolve({ code, lines });
          });
        }); //end smtp.connect
      }).catch(reject); //end smtp create.smtp server

      setTimeout(() => {
        if (connection && connection.close) {
          connection.quit();
        }

        reject(new Error('Unable to connect'));
      }, this.timeout);
    });
  }

  /**
   * Try a connection to an existing SMTP server on the localhost.
   * If no server exists, it will try creating one.
   *
   * @param {number} [port=9025] port number
   * @returns {Promise<SMTPConnection>} a new SMTP connection object.
   */
  _createSMTPServer(port = this.options.smtp.port) {
    const connection = new SMTPConnection({
      host: this.options.smtp.host,
      port: this.options.smtp.port,
      socketTimeout: 150
    });

    return new Promise((resolve, reject) => {
      connection.on('error', err => {
        if (err.code === 'ETIMEDOUT') {
          createServerInstance();
        }
      });

      connection.on('connect', () => {
        resolve(false);
      });

      connection.connect();

      setTimeout(createServerInstance, this.timeout / 4);

      function createServerInstance() {
        const server = smtp.createServer(() => { });

        server.on('error', () => {
          resolve(false);
        });

        server.listen(port, () => {
          resolve(connection);
        });
      }

      setTimeout(() => {
        reject(new Error('Unable to create server instance in timely fashion'));
      }, this.timeout);
    }).finally(res => {
      // Gracefully close any open connections we've made
      connection.quit();
      Promise.resolve(res);
    });
  }
}

exports = module.exports = MagnisesDNS;
