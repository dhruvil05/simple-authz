#!/usr/bin/env node

const { program } = require('commander');
const Authz = require('../../lib/core/authz');
const chalk = require('chalk'); // for colored output
const path = require('path');

program.version('1.1.0');

program
    .command('validate <policyFile>')
    .description('Validate a TOON policy file')
    .action((policyFile) => {
        try {
            const authz = new Authz();
            authz.load(policyFile);

            const rules = authz.getRules();
            console.log(chalk.green('✓ Policy file is valid\n'));
            console.log(`  File: ${chalk.gray(path.resolve(policyFile))}`);
            console.log(`  Rules loaded: ${chalk.blue(rules.length)}`);
            console.log(`  Roles: ${chalk.blue([...new Set(rules.map(r => r.role))].join(', '))}`);
            console.log();
        } catch (err) {
            console.error(chalk.red('✗ Validation failed\n'));
            console.error(`  ${chalk.red(err.message)}`);
            process.exit(1);
        }
    });

program
    .command('check <policyFile>')
    .requiredOption('--user <json>', 'User object as JSON')
    .requiredOption('--action <action>', 'Action to check')
    .requiredOption('--resource <resource>', 'Resource type')
    .option('--context <json>', 'Context/object as JSON')
    .description('Test an authorization decision')
    .action((policyFile, options) => {
        try {
            const authz = new Authz({ debugMode: true });
            authz.load(policyFile);

            const user = JSON.parse(options.user);
            const context = options.context ? JSON.parse(options.context) : {};

            const result = authz.explain(user, options.action, options.resource, context);

            console.log();
            if (result.allowed) {
                console.log(chalk.green('✓ ALLOWED\n'));
            } else {
                console.log(chalk.red('✗ DENIED\n'));
            }

            const userRoles = user.roles || (user.role ? [user.role] : []);

            console.log(`  User ID:        ${chalk.blue(user.id)}`);
            console.log(`  User roles:     ${chalk.blue(userRoles.join(', '))}`);
            console.log(`  Action:         ${chalk.blue(options.action)}`);
            console.log(`  Resource:       ${chalk.blue(options.resource)}`);
            console.log(`  Reason:         ${chalk.yellow(result.reason)}`);

            if (result.ruleMatched) {
                console.log(`  Rule matched:   ${chalk.green(result.ruleMatched)}`);
            }
            if (result.evaluationTime) {
                console.log(`  Eval time:      ${chalk.gray(result.evaluationTime + 'ms')}`);
            }
            console.log();

            process.exit(result.allowed ? 0 : 1);
        } catch (err) {
            console.error(chalk.red('✗ Check failed\n'));
            console.error(`  ${chalk.red(err.message)}`);
            process.exit(1);
        }
    });

program
    .command('benchmark <policyFile>')
    .option('--iterations <n>', 'Number of checks to run', '10000')
    .description('Benchmark authorization performance')
    .action((policyFile, options) => {
        const iterations = parseInt(options.iterations);

        try {
            const authz = new Authz({ cacheEnabled: true });
            authz.load(policyFile);

            const user = { id: 1, roles: ['admin', 'user'] };
            const object = { owner_id: 1, status: 'active' };

            // Warmup
            for (let i = 0; i < 10; i++) {
                authz.can(user, 'edit', 'resource', object);
            }

            // Benchmark
            const start = process.hrtime.bigint();
            for (let i = 0; i < iterations; i++) {
                authz.can(user, 'edit', 'resource', object);
            }
            const end = process.hrtime.bigint();

            const timeMs = Number(end - start) / 1_000_000;
            const checksPerSec = Math.round((iterations / timeMs) * 1000);

            console.log();
            console.log(chalk.cyan('Performance Benchmark'));
            console.log('─'.repeat(40));
            console.log(`  Iterations:    ${chalk.blue(iterations.toLocaleString())}`);
            console.log(`  Total time:    ${chalk.blue(timeMs.toFixed(2))} ms`);
            console.log(`  Avg per check: ${chalk.blue((timeMs / iterations).toFixed(4))} ms`);
            console.log(`  Checks/sec:    ${chalk.green(checksPerSec.toLocaleString())}`);

            const stats = authz.cacheStats();
            console.log();
            console.log(chalk.cyan('Cache Statistics'));
            console.log('─'.repeat(40));
            console.log(`  Hit rate:      ${chalk.blue(stats.hitRate)}`);
            console.log(`  Cache size:    ${chalk.blue(stats.size)}/${stats.maxSize}`);
            console.log(`  Hits:          ${chalk.green(stats.hits.toLocaleString())}`);
            console.log(`  Misses:        ${chalk.yellow(stats.misses.toLocaleString())}`);
            console.log();
        } catch (err) {
            console.error(chalk.red('✗ Benchmark failed\n'));
            console.error(`  ${chalk.red(err.message)}`);
            process.exit(1);
        }
    });

program.parse();