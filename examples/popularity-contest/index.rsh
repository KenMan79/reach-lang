'reach 0.1';

const [ isOutcome, ALICE_WINS, BOB_WINS, TIMEOUT ] = makeEnum(3);

const Common = {
  showOutcome: Fun([UInt, UInt, UInt], Null),
};

export const main =
  Reach.App(
    { connectors: [ETH, ALGO] },
    [['Pollster',
      { ...Common,
        getParams: Fun([], Object({ ticketPrice: UInt,
                                    deadline: UInt,
                                    aliceAddr: Address,
                                    bobAddr: Address })) }],
     ['class', 'Voter',
      { ...Common,
        getVote: Fun([], Bool),
        voterWas: Fun([Address], Null),
        shouldVote: Fun([], Bool),
      } ],
    ],
    (Pollster, Voter) => {
      const showOutcome = (which, forA, forB) => () => {
        each([Pollster, Voter], () =>
          interact.showOutcome(which, forA, forB)); };

      Pollster.only(() => {
        const { ticketPrice, deadline, aliceAddr, bobAddr } =
          declassify(interact.getParams());
      });
      Pollster.publish(ticketPrice, deadline, aliceAddr, bobAddr);

      const endTime = lastConsensusTime() + deadline;
      const timeRemaining = () =>
        (endTime - lastConsensusTime());
      const keepGoing = () =>
        (endTime > lastConsensusTime());

      const [ forA, forB ] =
        parallel_reduce([ 0, 0])
        .invariant(balance() == (forA + forB) * ticketPrice)
        .while( keepGoing() )
        .case(Voter, (() => ({
            msg: declassify(interact.getVote()),
            when: declassify(interact.shouldVote()),
          })),
          (() => ticketPrice),
          ((forAlice) => {
            const voter = this;
            Voter.only(() => interact.voterWas(voter));
            const [ nA, nB ] = forAlice ? [ 1, 0 ] : [ 0, 1 ];
            return [ forA + nA, forB + nB ]; }))
        .timeout(timeRemaining(), () => {
          race(Pollster, Voter).publish();
          showOutcome(TIMEOUT, forA, forB)();
          return [ forA, forB ]; });

      const outcome = forA >= forB ? ALICE_WINS : BOB_WINS;
      const winner = outcome == ALICE_WINS ? aliceAddr : bobAddr;
      transfer(balance()).to(winner);
      commit();
      showOutcome(outcome, forA, forB)();
    });
