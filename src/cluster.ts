import pm2 from 'pm2';

let instances = parseInt(process.env.WEB_CONCURRENCY || '20');
const maxMemory = parseInt(process.env.WEB_MEMORY || '512');

console.log('instances', instances);

if (instances < 0 || instances > 20) {
    console.warn('Instances out of range, setting to max');
    instances = 20;
}

console.log('maxMemory', maxMemory);

pm2.connect(() => {
    pm2.start({
        script: 'build/index.js',
        instances: instances,
        max_memory_restart: `${maxMemory}M`,
        wait_ready: true,
        env: {
            NODE_ENV: 'production',
            NODE_PATH: '.'
        },
    }, (err) => {
        if (err) {
            return console.error('Error while launching applications', err.stack || err);
        }

        console.log('PM2 and application has been succesfully started');

        pm2.launchBus((err, bus) => {
            console.log('[PM2] Log streaming started');

            bus.on('log:out', (packet: { data: unknown }) => {
                console.log('[Reg] %s', packet.data);
            });

            bus.on('log:err', (packet: { data: unknown }) => {
                console.error('[Err] %s', packet.data);
            });
        });
    });
});
