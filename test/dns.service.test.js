import test from 'ava';
import DNS from '../dist/dns.js';
import Promise from 'bluebird';

////////////////
// Constructor

test.cb('Test Timeout Function', t => {
  t.plan(1);

  const dns     = new DNS(0.5);
  const timeout = dns.lookup('google.com');

  timeout
    .then(() => {
      t.fail();
      t.end();
    })
    .catch(res => {
      t.is(res.message, 'Timeout Limit Reached');

      t.end();
    });

  setTimeout(() => {
    // Timeout limit reject should've happened after 2ms.
    // After 2.5s, we know test failed.
    t.fail();
    t.end();
  }, 2500);
});

///////////
// ping()

test.cb('ping google.com', t => {
  t.plan(2);

  const dns    = new DNS();
  const google = dns.ping('google.com');

  google
    .then(res => {
      t.is(typeof res, 'number');
      t.is(res > 0, true);

      t.end();
    })
    .catch(() => {
      t.fail();
      t.end();
    });
});

test.cb('ping of google.com address', t => {
  t.plan(4);

  const dns    = new DNS();
  const google = dns.lookup('google.com', 4);

  google
    .then(res => {
      t.is(typeof res.address, 'string');
      t.is(res.family, 4);

      return dns.ping(res.address);
    })
    .then(res => {
      t.is(typeof res, 'number');
      t.is(res > 0, true);

      t.end();
    })
    .catch(() => {
      t.fail();
      t.end();
    });
});

/////////////
// lookup()

test.cb('Lookup ip of google.com', t => {
  t.plan(2);

  const dns    = new DNS();
  const google = dns.lookup('google.com');

  google
    .then(res => {
      t.is(typeof res.address, 'string');
      t.is(res.family, 4);

      t.end();
    })
    .catch(() => {
      t.fail();
      t.end();
    });
});

test.cb('Lookup ip of mail-qk0-f171.google.com', t => {
  t.plan(3);

  const dns    = new DNS();
  const google = dns.lookup('mail-qk0-f171.google.com');

  google
    .then(res => {
      t.is(typeof res.address, 'string');
      t.is(res.family, 4);
      t.is(res.address, '209.85.220.171');

      t.end();
    })
    .catch(() => {
      t.fail();
      t.end();
    });
});

test.cb('Failed lookup of qazwsxedc123.com', t => {
  t.plan(3);

  const dns     = new DNS();
  const failed  = dns.lookup('qazwsxedc123nogamenolife.com');

  failed
    .then(() => {
      t.fail();
      t.end();
    })
    .catch(error => {
      t.is(error.code, 'ENOTFOUND');
      t.is(error.errno, 'ENOTFOUND');
      t.is(error.hostname, 'qazwsxedc123nogamenolife.com');

      t.end();
    });
});

////////////////////
// lookupService()

test.cb('lookupService of google.com:80', t => {
  t.plan(4);

  const dns    = new DNS();
  const google = dns.lookup('google.com');

  google
    .then(res => {
      t.is(typeof res.address, 'string');
      t.is(res.family, 4);

      return dns.lookupService(res.address, 80);
    })
    .then(res => {
      t.is(typeof res.hostname, 'string');
      t.is(res.service, 'http');

      t.end();
    })
    .catch(() => {
      t.fail();
      t.end();
    });
});

test.cb('lookupService of google.com:443', t => {
  t.plan(4);

  const dns    = new DNS();
  const google = dns.lookup('google.com');

  google
    .then(res => {
      t.is(typeof res.address, 'string');
      t.is(res.family, 4);

      return dns.lookupService(res.address, 443);
    })
    .then(res => {
      t.is(typeof res.hostname, 'string');
      t.is(res.service, 'https');

      t.end();
    })
    .catch(() => {
      t.fail();
      t.end();
    });
});

//////////////
// resolve()

test.cb('resolve github.com to 2 IPs', t => {
  t.plan(2);

  const dns    = new DNS();
  const github = dns.resolve('github.com');

  github
    .then(res => {
      t.is(typeof res, 'object');
      t.is(typeof res[0], 'string');

      t.end();
    })
    .catch(() => {
      t.fail();
      t.end();
    });
});

///////////////
// resolve4()

test.cb('resolve4 google.com to 2 IP v4', t => {
  t.plan(2);

  const dns    = new DNS();
  const google = dns.resolve4('google.com');

  google
    .then(res => {
      t.is(typeof res, 'object');
      t.is(typeof res[0], 'string');

      t.end();
    })
    .catch(() => {
      t.fail();
      t.end();
    });
});

//////////////
// resolve6()

test.cb('resolve6 google.com to 2 IP v6', t => {
  t.plan(2);

  const dns    = new DNS();
  const google = dns.resolve6('google.com');

  google
    .then(res => {
      t.is(typeof res, 'object');
      t.is(typeof res[0], 'string');

      t.end();
    })
    .catch(() => {
      t.fail();
      t.end();
    });
});

///////////////////
// resolveCname()

test.cb('resolveCname support.google.com to a different name', t => {
  t.plan(3);

  const dns     = new DNS();
  const google  = dns.resolveCname('support.google.com');

  google
    .then(res => {
      t.is(typeof res, 'object');
      t.is(res.length, 1);
      t.is(res[0], 'www3.l.google.com');

      t.end();
    })
    .catch(() => {
      t.fail();
      t.end();
    });
});

////////////////
// resolveMx()

test.cb('resolveMx gmail.com', t => {
  t.plan(4);

  const dns   = new DNS();
  const gmail = dns.resolveMx('gmail.com');

  gmail
    .then(res => {
      t.is(typeof res, 'object');
      t.is(res.length, 5);
      t.is(typeof res[0].exchange, 'string');
      t.is(typeof res[0].priority, 'number');

      t.end();
    })
    .catch(() => {
      t.fail();
      t.end();
    });
});

////////////////
// resolveNs()

test.cb('resolveNs google.com', t => {
  t.plan(3);

  const dns    = new DNS();
  const google = dns.resolveNs('google.com');

  google
    .then(res => {
      t.is(typeof res, 'object');
      t.is(res.length, 4);
      t.is(typeof res[0], 'string');

      t.end();
    })
    .catch(() => {
      t.fail();
      t.end();
    });
});

/////////////////
// resolveSoa()

test.cb('resolveSoa gmail.com', t => {
  t.plan(3);

  const dns   = new DNS();
  const gmail = dns.resolveSoa('gmail.com');

  gmail
    .then(res =>{
      t.is(typeof res, 'object');
      t.is(typeof res.nsname, 'string');
      t.is(typeof res.hostmaster, 'string');

      t.end();
    })
    .catch(() => {
      t.fail();
      t.end();
    });
});

/////////////////
// resolveSrv()

test.cb('resolveSrv _xmpp-server._tcp.gmail.com', t => {
  t.plan(2);

  const dns   = new DNS();
  const ocean = dns.resolveSrv('_xmpp-server._tcp.gmail.com');

  ocean
    .then(res => {
      t.is(typeof res, 'object');
      t.is(res.length, 5);

      t.end();
    })
    .catch(() => {
      t.fail();
      t.end();
    });
});

/////////////////
// resolveTxt()

test.cb('resolveTxt gmail.com', t => {
  t.plan(4);

  const dns   = new DNS();
  const gmail = dns.resolveTxt('_spf.google.com');

  gmail
    .then(res => {
      t.is(typeof res, 'object');
      t.is(typeof res[0], 'object');
      t.is(typeof res[0][0], 'string');
      t.is(res[0][0].indexOf('include') > -1, true);

      t.end();
    })
    .catch(() => {
      t.fail();
      t.end();
    });
});

//////////////
// reverse()

test.cb('reverse google.com', t => {
  t.plan(4);

  const dns    = new DNS();
  const google = dns.lookup('google.com');

  google
    .then(res => {
      t.is(typeof res.address, 'string');
      t.is(res.family, 4);

      return dns.reverse(res.address);
    })
    .then(res => {
      t.is(typeof res, 'object');
      t.is(typeof res[0], 'string');

      t.end();
    })
    .catch(() => {
      t.fail();
      t.end();
    });
});

/////////////////
// setServers()

test.cb('setServers', t => {
  t.plan(3);

  const dns    = new DNS();
  const google = dns.resolve4('google.com');

  google
    .then(res => {
      t.is(typeof res, 'object');
      t.is(typeof res[0], 'string');

      return dns.setServers(res);
    })
    .then(res => {
      t.is(res, true);

      t.end();
    })
    .catch(() => {
      t.fail();
      t.end();
    });
});

/////////////////
// getServers()

test.cb('getServers', t => {
  t.plan(1);

  const dns   = new DNS();
  const gmail = dns.getServers();

  gmail
    .then(res => {
      t.is(typeof res, 'object');

      t.end();
    })
    .catch(() => {
      t.fail();
      t.end();
    });
});

///////////
// helo()

test.cb('Says hello to server', t => {
  t.plan(2);

  const dns  = new DNS();
  const data = dns.helo('gmail-smtp-in.l.google.com');

  data
    .then(res => {
      t.is(res.code, 250);
      t.is(res.lines[0], 'gmail-smtp-in.l.google.com');

      t.end();
    })
    .catch(() => {
      t.fail();
      t.end();
    });
});

////////////////////////
// _createSMTPServer()

test.cb('Creates SMTP Server', t => {
  t.plan(2);

  const dns  = new DNS();
  const data = dns._createSMTPServer(9028);

  data
    .then(server => {
      t.is(server.domain, null);
      t.is(typeof server._maxListeners, 'undefined');

      t.end();
    })
    .catch(() => {
      t.fail();
      t.end();
    });
});
