'use strict';

module.exports = function(grunt) {

	var localConfig;

	try {
		localConfig = require('./server/config/local.env');
	} catch(e) {
		localConfig = {};
	}

	require('jit-grunt')(grunt, {
		express: 'grunt-express-server',
		buildControl: 'grunt-build-control'
	});

	// Grunt time describes how long tasks will take on build
	require('time-grunt')(grunt);

	// Define task configuration
	grunt.initConfig({

		// Project Settings
		pkg: grunt.file.readJSON('package.json'),

		app: {
			client: require('./bower.json').appPath || 'client',
			dist: 'dist'
		},
		express: {
			options: {
				port: process.env.PORT || 9000
			},
			dev: {
				options: {
					script: 'server/app.js',
					debug: true
				}
			},
			prod: {
				options: {
					script: 'dist/server/app.js'
				}
			}
		},
		open: {
			server: {
				url: 'http://localhost:<%= express.options.port %>'
			}
		},
		watch: {
      		gruntfile: {
        		files: ['Gruntfile.js']
      		},
      		express: {
        		files: [
          			'server/**/*.{js,json}'
        		],
        		tasks: ['express:dev', 'wait'],
        		options: {
          			livereload: true,
          			nospawn: true // Without this option specified express won't be reloaded
        		}
      		}
		},

		// Keep code up to jshint standards
		jshint: {
			options: {
				jshintrc: '<%= app.client %>/.jshintrc',
				reporter: require('jshint-stylish')
			},
			server: {
				options: {
					jshintrc: 'server/.jshintrc'
				},
				src: [
					'server/**/*.js',
					'!server/**/*.spec.js'
				]
			},
			test: {
				options: {
					jshintrc: 'server/.jshintrc-spec'
				},
				src: [ 'server/**/*.spec.js' ]
			}
		},

		// Node debugging
		'node-inspector': {
			custom: {
				options: {
					'web-host': 'localhost'
				}
			}
		},

		// Node monitor; use nodemon to run server in debug mode with an initial breakpoint
		nodemon: {
			debug: {
				script: 'server/app.js',
				options: {
					nodeArgs: [ '--debug-brk' ],
					env: { PORT: process.env.PORT || 9000 }
				},
				callback: function(nodemon) {
					nodemon.on('log', function(event) {
						console.log(event.colour);
					});

					// Opens browser on intial server start
					nodemon.on('config:update', function() {
						setTimeout(function () {
							require('open')('http://localhost:8080/debug?port=5858');
						}, 500);
					});
				}
			}
		},

		buildcontrol: {
			options: {
				dir: 'dist',
				commit: true,
				push: true,
				connectCommits: false,
				message: 'Built %sourceName% from commit %sourceCommit% on branch %sourceBranch%'
			}
		},

		// Run some tasks in parallel to speed up the build process
		concurrent: {
			debug: {
				tasks: [
					'nodemon',
					'node-inspector'
				],
				options: {
					logConcurrentOutput: true
				}
			}
		},

		// Test settings
		karma: {
			unit: {
				configFile: 'karma.conf.js',
				singleRun: true
			}
		},

		mochaTest: {
			options: {
				reporter: 'spec'
			},
			src: ['server/**/*.spec.js']
		},

		env: {
			test: {
				NODE_ENV: 'test'
			},
			prod: {
				NODE_ENV: 'production'
			},
			all: localConfig
		}
	});

	// Used for delaying livereload until after server has restarted
	grunt.registerTask('wait', function () {
		grunt.log.ok('Waiting for server reload...');

		var done = this.async();

		setTimeout(function () {
			grunt.log.writeln('Done waiting!');
				done();
		}, 1500);
	
	});

	grunt.registerTask('express-keepalive', 'Keep grunt running', function() {
		this.async();
	});

	grunt.registerTask('serve', function (target) {

		if (target === 'debug') {
			return grunt.task.run([
				'env:all',
				'concurrent:debug'
			]);
		}

		grunt.task.run([
			'env:all',
			'express:dev',
			'wait',
			'open',
			'watch'
		]);
	});

	grunt.registerTask('server', function () {
		grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
		grunt.task.run(['serve']);
	});

	grunt.registerTask('test', function(target) {
		if (target === 'server') {
			return grunt.task.run([
				'env:all',
				'env:test',
				'mochaTest'
			]);
		}

		else grunt.task.run([
			'test:server'
		]);
	});

	grunt.registerTask('default', [
		'newer:jshint',
		'test',
		'build'
	]);
};