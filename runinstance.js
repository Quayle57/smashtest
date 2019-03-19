/**
 * Represents a running test instance. Kind of like a "thread".
 */
class RunInstance {
    constructor(runner) {
        this.runner = runner;

        this.tree = this.runner.tree;                   // Tree currently being executed
        this.currBranch = null;                         // Branch currently being executed
        this.currStep = null;                           // Step currently being executed

        this.isPaused = false;                          // true if we're currently paused

        this.persistant = this.runner.persistant;       // persistant variables
        this.global = [];                               // global variables
        this.local = [];                                // local variables
    }

    /**
     * Grabs branches and steps from this.tree and executes them. Exits when there's nothing left to execute, or if a pause occurs.
     * @return {Promise} Promise that gets resolved with true once done executing, or gets resolved with false if a branch was paused
     */
    run() {
        this.isPaused = false;
        return new Promise(async (resolve, reject) => {
            this.currBranch = this.tree.nextBranch();
            while(this.currBranch) {
                if(this.currBranch == 'wait') {
                    // wait 1 sec
                    await new Promise((resolve, reject) => {
                        setTimeout(() => { resolve(); }, 1000);
                    });
                }
                else { // this.currBranch is an actual Branch
                    this.currStep = this.tree.nextStep(this.currBranch, true, true);
                    while(this.currStep) {
                        runStep(this.currStep);

                        if(this.isPaused) { // the current step caused a pause
                            resolve(false);
                            break;
                        }

                        this.currStep = this.tree.nextStep(this.currBranch, true, true);
                    }

                    // NOTE: Tree.nextBranch() handles serving up Before/After Everything branches
                    // NOTE: Tree.nextStep() handles serving up After Every Branch steps

                    // Execute After Every Branch hooks
                    this.local.successful = this.currBranch.isPassed;
                    this.local.error = this.currBranch.error;
                    this.currBranch.afterEveryBranch.forEach(branch => {
                        branch.steps.forEach(step => {
                            runStep(step);
                        });
                    });
                }

                this.currBranch = this.tree.nextBranch();
            }

            resolve(!this.isPaused);
        });
    }

    /**
     * Runs the given step
     * Sets this.isPaused if the step requires execution to pause
     * Sets passed/failed status on step, sets the step's error and log
     */
    runStep(step) {
        if(step.isDebug) {
            this.isPaused = true;
            return;
        }

        var failError = null;

        try {
            if(typeof step.codeBlock != 'undefined') {
                var code = step.codeBlock;

                if(utils.canonicalize(step.text) == "execute in browser") {
                    this.execInBrowser(code); // this function will be injected into RunInstance by a built-in function during Before Everything
                }
                else {






                    eval(code);
                }
            }













        }
        catch(e) {
            failError = e;
            failError.filename = step.filename;
            failError.lineNumber = step.lineNumber;
        }

        // Marks the step as passed/failed, sets the step's asExpected, error, and log
        var isPassed = false;
        var asExpected = false;
        if(step.isExpectedFail) {
            if(failError) {
                isPassed = false;
                asExpected = true;
            }
            else {
                failError = new Error("This step passed, but it was expected to fail (#)");
                failError.filename = step.filename;
                failError.lineNumber = step.lineNumber;

                isPassed = true;
                asExpected = false;
            }
        }
        else { // fail is not expected
            if(failError) {
                isPassed = false;
                asExpected = false;
            }
            else {
                isPassed = true;
                asExpected = true;
            }
        }

        if(this.currStep) {
            this.tree.markStep(this.currBranch, this.currStep, isPassed, asExpected, failError, failError ? failError.failBranchNow : false, true);
            // NOTE: markStep() is called on this.currStep, rather than step, so that if step is an After Every Step, the error obj is not attached to it
        }
        else { // happens when an After Every Branch step is being executed
            // Attach the error to the Branch and fail it
            this.currBranch.error = failError;
            this.tree.markBranch(this.currBranch, false);
        }

        // Pause if the step failed or is unexpected
        if(this.runner.pauseOnFail && (!isPassed || !asExpected)) {
            this.runner.pauseOnFail = false;
            this.isPaused = true;
            return;
        }

        // Execute After Every Step hooks
        this.local.successful = this.currStep.isPassed;
        this.local.error = this.currStep.error;
        this.currBranch.afterEveryStep.forEach(branch => {
            branch.steps.forEach(step => {
                runStep(step);
            });
        });

        // Update the report
        this.tree.generateReport(this.runner.reporter);

        // If we're only meant to run one step before a pause
        if(this.runner.runOneStep) {
            this.runner.runOneStep = false;
            this.isPaused = true;
        }
    }

    /**
     * Runs the given branch, then pauses
     * Call when already paused
     */
    injectAndRun(branch) {
        if(!this.isPaused) {
            return; // fail gracefully
        }






    }

    /**
     * Logs the given string to the current step
     */
    log(str) {
        if(this.currStep) {
            logToObj(this.currStep)
        }
        else if(this.currBranch) {
            logToObj(this.currBranch)
        }

        function logToObj(obj) {
            if(typeof obj.log == 'undefined') {
                obj.log = '';
            }

            obj.log += str + '\n';
        }
    }

    /**
     * @return {Tree} The tree associated with the runner
     */
    getTree() {
        return this.runner.tree;
    }

    /**
     * @return {Branch} The Branch currently being executed
     */
    getCurrentBranch() {
        return this.currBranch;
    }

    /**
     * @return {Step} The Step currently being executed
     */
    getCurrentStep() {
        return this.currStep;
    }
}
module.exports = RunInstance;
