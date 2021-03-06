import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import api from '../../services/api';

import Container from '../../components/Container';
import {
  Loading,
  Owner,
  IssueList,
  Filter,
  Navigation,
  ArrowLeft,
  ArrowRight,
} from './styles';

export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    repoName: '',
    repository: {},
    issues: [],
    loading: true,
    filterState: 'open',
    page: 1,
  };

  async componentDidMount() {
    const { match } = this.props;

    const repoName = decodeURIComponent(match.params.repository);
    const { filterState } = this.state;

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: filterState,
          per_page: 5,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
      repoName,
    });
  }

  componentDidUpdate(_, prevState) {
    const { filterState } = this.state;

    if (filterState !== prevState.filterState) {
      this.getIssues();
    }
  }

  getIssues = async (page = 1) => {
    const { filterState, repoName } = this.state;

    const { data } = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: filterState,
        per_page: 5,
        page,
      },
    });

    this.setState({
      issues: data,
      page,
    });
  };

  priorPage = () => {
    const { page } = this.state;
    this.getIssues(page - 1);
  };

  nextPage = () => {
    const { page } = this.state;
    this.getIssues(page + 1);
  };

  handleChange = e => {
    this.setState({ filterState: e.target.value });
  };

  render() {
    const { repository, issues, loading, filterState, page } = this.state;

    if (loading) {
      return <Loading>Carregando</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        <Filter>
          <label>Issues:</label>
          <select value={filterState} onChange={this.handleChange}>
            <option value="open">Abertas</option>
            <option value="closed">Fechadas</option>
            <option value="all">Todas</option>
          </select>
        </Filter>

        <IssueList>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>

        <Navigation>
          <button type="button" disabled={page === 1} onClick={this.priorPage}>
            <ArrowLeft />
          </button>
          <button
            type="button"
            disabled={issues.length < 5}
            onClick={this.nextPage}
          >
            <ArrowRight />
          </button>
        </Navigation>
      </Container>
    );
  }
}
