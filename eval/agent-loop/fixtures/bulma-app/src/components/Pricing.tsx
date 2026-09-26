import { useState } from 'react';
import { PLANS, STATS } from '../data';

type Billing = 'monthly' | 'yearly';

export function Pricing() {
  const [billing, setBilling] = useState<Billing>('monthly');
  const price = (monthly: number) =>
    billing === 'monthly' ? monthly : Math.round(monthly * 12 * 0.8);

  return (
    <section className="section has-background-light" id="pricing">
      <div className="container">
        <h2 className="title is-2 has-text-centered">Pricing</h2>
        <div className="tabs is-centered is-toggle">
          <ul>
            <li className={billing === 'monthly' ? 'is-active' : ''}>
              <a onClick={() => setBilling('monthly')}>Monthly</a>
            </li>
            <li className={billing === 'yearly' ? 'is-active' : ''}>
              <a onClick={() => setBilling('yearly')}>
                Yearly <span className="tag is-success ml-2">Save 20%</span>
              </a>
            </li>
          </ul>
        </div>
        <table className="table is-fullwidth is-striped is-hoverable">
          <thead>
            <tr>
              <th>Plan</th>
              <th>Seats</th>
              <th>Reports</th>
              <th className="has-text-right">
                Price per {billing === 'monthly' ? 'month' : 'year'}
              </th>
            </tr>
          </thead>
          <tbody>
            {PLANS.map(plan => (
              <tr key={plan.name}>
                <td>
                  <strong>{plan.name}</strong>
                </td>
                <td>{plan.seats}</td>
                <td>{plan.reports}</td>
                <td className="has-text-right">${price(plan.monthly)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <nav className="level mt-6">
          {STATS.map(stat => (
            <div className="level-item has-text-centered" key={stat.label}>
              <div>
                <p className="heading">{stat.label}</p>
                <p className="title">{stat.value}</p>
              </div>
            </div>
          ))}
        </nav>
        <p className="has-text-weight-semibold mb-2">
          Trial seats in use: 6 of 10
        </p>
        <progress className="progress is-primary" value="60" max="100">
          60%
        </progress>
      </div>
    </section>
  );
}
